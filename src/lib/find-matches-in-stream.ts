import path from "path";

import tar, { Headers as TarHeaders } from "tar-stream";

import { bufferStream } from "./buffer-from-stream";

export interface TarEntry {
  type: TarHeaders["type"];
  path: string;
  content?: string;
}

/**
 * @param {NodeJS.ReadWriteStream} stream
 * @param {string} filename
 * @returns {Promise<Array<File>>}
 */
async function findMatchingEntries(
  stream: NodeJS.ReadWriteStream,
  filename: string,
  onEntry: (newEntry: TarEntry) => Promise<void>
): Promise<void> {
  let entries: { [path: string]: TarEntry } = {};

  stream
    .pipe(tar.extract())
    .on("error", console.error)
    .on("entry", async (header, stream, next) => {
      let entry: TarEntry = {
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
      if (
        entry.type !== "file" ||
        !path.dirname(entry.path).startsWith(filename)
      ) {
        stream.resume();
        stream.on("end", next);
        return;
      }

      try {
        let content = await bufferStream(stream);
        entry.content = content.toString("utf8");
        await onEntry(entry);
        entries[entry.path] = entry;
        next();
      } catch (error) {
        next(error);
      }
    });
}

export { findMatchingEntries };
