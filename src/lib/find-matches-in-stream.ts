import path from "path";

import tar, { Headers as TarHeaders } from "tar-stream";

import { bufferStream } from "./buffer-from-stream";

export interface File {
  type: "file";
  path: string;
  content: string;
}

interface Entry {
  type: TarHeaders["type"];
  path: string;
  content?: never;
}

type FileEntry = File | Entry;

/**
 * @param {NodeJS.ReadWriteStream} stream
 * @param {string} filename
 * @returns {Promise<Array<File>>}
 */
async function findMatchingEntries(
  stream: NodeJS.ReadWriteStream,
  filename: string,
  onEntry: (newEntry: File) => Promise<void>
): Promise<void> {
  let entries: { [path: string]: FileEntry } = {};

  stream
    .pipe(tar.extract())
    .on("error", console.error)
    .on("entry", async (header, stream, next) => {
      let entry: FileEntry = {
        // Most packages have header names that look like `package/index.js`
        // so we shorten that to just `/index.js` here. A few packages use a
        // prefix other than `package/`. e.g. the firebase package uses the
        // `firebase_npm/` prefix. So we just strip the first dir name.
        path: header.name.replace(/^[^/]+\/?/, "/"),
        type: header.type,
      };

      // Dynamically create "directory" entries for all subdirectories
      // in this entry's path. Some tarballs omit directory entries for
      // some reason, so this is the "brute force" method.
      let dir = path.dirname(entry.path);
      while (dir !== "/") {
        if (!entries[dir] && path.dirname(dir).startsWith(filename)) {
          entries[dir] = { path: dir, type: "directory" };
        }
        dir = path.dirname(dir);
      }

      // Ignore non-files and files that aren't in this directory.
      // Also ignore non markdown files.
      if (
        entry.type !== "file" ||
        !path.dirname(entry.path).startsWith(filename) ||
        !entry.path.endsWith(".md")
      ) {
        stream.resume();
        stream.on("end", next);
        return;
      }

      try {
        let content = await bufferStream(stream);

        let regex = new RegExp(`^${filename}`, "i");

        entry = {
          type: "file",
          content: content.toString("utf-8"),
          path: entry.path.replace(regex, ""),
        };

        await onEntry(entry);

        entries[entry.path] = entry;

        next();
      } catch (error) {
        next(error);
      }
    });
}

export { findMatchingEntries };
