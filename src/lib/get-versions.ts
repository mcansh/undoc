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

let branchOrTagRegex = /^refs\/(heads|tags)\//;
let branchRegex = /^refs\/heads\//;
let tagRegex = /^refs\/tags\//;

function getBranchOrTagFromRef(ref: string): string {
  return ref.replace(branchOrTagRegex, "");
}

function getBranchFromRef(ref: string): string {
  return ref.replace(branchRegex, "");
}
function getTagFromRef(ref: string): string {
  return ref.replace(tagRegex, "");
}

function getVersionHead(ref: string): string {
  let version = getTagFromRef(ref);

  let tag = semver.coerce(version);

  if (!tag) {
    throw new Error(`Invalid version: "${version}"`);
  }

  let head =
    tag.major > 0
      ? `v${tag.major}`
      : tag.minor > 0
      ? `v0.${tag.minor}`
      : `v0.0.${tag.patch}`;

  return head;
}

function getVersions(refs: Array<string>): Array<VersionHead> {
  let tags = refs.map((ref) => ref.replace(/^refs\/tags\//, ""));
  let validTags = tags.filter((ref) => semver.valid(ref));

  let sorted = validTags.sort((a, b) => semver.compare(b, a));

  let versions = sorted.map((version) => {
    let head = getVersionHead(version);

    return {
      head,
      version,
      isLatest: false,
    };
  });

  versions[0].isLatest = true;

  return versions;
}

export {
  getVersions,
  getVersionHead,
  getBranchOrTagFromRef,
  getBranchFromRef,
  getTagFromRef,
};
export type { VersionHead };
