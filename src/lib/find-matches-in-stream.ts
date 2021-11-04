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
  existingFilepaths: Array<string> = [],
  opts?: {
    onNewEntry?: (entry: File) => Promise<void>;
    onUpdatedEntry?: (entry: File) => Promise<void>;
    onDeletedEntries?: (entry: Array<File>) => Promise<void>;
  }
): Promise<void> {
  let entries: { [path: string]: FileEntry } = {};
  let entriesFound: Array<File> = [];

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

        if (existingFilepaths.includes(entry.path)) {
          console.log(`Updating ${entry.path}`);
          if (typeof opts?.onUpdatedEntry === "function") {
            await opts.onUpdatedEntry(entry);
          }
        } else {
          console.log(`Adding ${entry.path}`);
          if (typeof opts?.onNewEntry === "function") {
            await opts.onNewEntry(entry);
          }
        }

        entries[entry.path] = entry;
        entriesFound.push(entry);

        next();
      } catch (error) {
        next(error);
      }
    })
    .on("finish", () => {
      const deletedEntries = entriesFound.filter(
        (entry) => !existingFilepaths.includes(entry.path)
      );

      if (typeof opts?.onDeletedEntries === "function") {
        return opts?.onDeletedEntries(deletedEntries);
      }
    });
}

export { findMatchingEntries };
