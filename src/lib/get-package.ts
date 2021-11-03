import { URL } from "url";
import type { RequestOptions } from "https";

import { https } from "follow-redirects";
import gunzip from "gunzip-maybe";

import { bufferStream } from "./buffer-from-stream";

let agent = new https.Agent({
  keepAlive: true,
});

/**
 * @param {RequestOptions} options
 */
function get(options: RequestOptions) {
  return new Promise((accept, reject) => {
    https.get(options, accept).on("error", reject);
  });
}

/**
 * @param packageName The name of the package to fetch.
 * @param version The version of the package to fetch.
 * @returns {NodeJS.ReadWriteStream} A stream of the tarball'd contents of the given package.
 */
async function getPackage(
  packageName: string,
  version: string,
  getOptions: RequestOptions = {}
): Promise<NodeJS.ReadWriteStream | null> {
  let tarballURL = `https://github.com/${packageName}/archive/${version}.tar.gz`;

  console.debug("Fetching package for %s from %s", packageName, tarballURL);

  let { hostname, pathname } = new URL(tarballURL);

  let options: RequestOptions = {
    agent: agent,
    hostname: hostname,
    path: pathname,
    ...getOptions,
  };

  let res: any = await get(options);

  if (res.statusCode === 200) {
    let stream = res.pipe(gunzip());
    // stream.pause();
    return stream;
  }

  if (res.statusCode === 404) {
    return null;
  }

  let content = (await bufferStream(res)).toString("utf-8");

  console.error(
    "Error fetching tarball for %s@%s (status: %s)",
    packageName,
    version,
    res.statusCode
  );

  console.error(content);

  return null;
}

export { getPackage };
