import * as semver from "semver";

interface VersionHead {
  /**
   * like v2 or v0.4
   */
  head: string;

  /**
   * The full version like v2.1.1
   */
  version: string;

  /**
   * So we know to fetch from the ref or not
   */
  isLatest: boolean;
}

async function getVersions(refs: Array<string>): Promise<Array<VersionHead>> {
  let tags = refs.map((ref) => ref.replace(/^refs\/tags\//, ""));
  let validTags = tags.filter((ref) =>
    semver.valid(ref.replace(/^refs\/tags\//, ""))
  );

  let sorted = validTags.sort((a, b) => semver.compare(b, a));

  let versions = sorted.map((version) => {
    let tag = semver.coerce(version);

    if (!tag) {
      throw new Error(`Invalid version: ${version}`);
    }

    let head =
      tag.major > 0
        ? `v${tag.major}`
        : tag.minor > 0
        ? `v0.${tag.minor}`
        : `v0.0.${tag.patch}`;

    return {
      head,
      version,
      isLatest: false,
    };
  });

  versions[0].isLatest = true;

  return versions;
}

export { getVersions };
export type { VersionHead };
