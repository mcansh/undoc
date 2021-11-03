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
  filename: string
): Promise<Array<File>> {
  // filename = /some/dir/name
  return new Promise((accept, reject) => {
    const entries: { [path: string]: FileEntry } = {};

    stream
      .pipe(tar.extract())
      .on("error", reject)
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
        if (
          entry.type !== "file" ||
          !path.dirname(entry.path).startsWith(filename)
        ) {
          stream.resume();
          stream.on("end", next);
          return;
        }

        try {
          const content = await bufferStream(stream);

          entry = {
            type: "file",
            content: content.toString("utf-8"),
            path: entry.path,
          };

          entries[entry.path] = entry;

          next();
        } catch (error) {
          // @ts-ignore
          next(error);
        }
      })
      .on("finish", () => {
        let files = Object.values(entries).filter(
          (entry): entry is File => entry.type === "file"
        );

        accept(files);
      });
  });
}

export { findMatchingEntries };
