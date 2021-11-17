import * as semver from "semver";
import invariant from "tiny-invariant";

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

function getBranchOrTagFromRef(ref: string): string {
  let regex = /^refs\/(heads|tags)\//;
  invariant(regex.test(ref), `Expected a ref, received "${ref}"`);
  return ref.replace(regex, "");
}

function getBranchFromRef(ref: string): string {
  let regex = /^refs\/heads\//;
  invariant(regex.test(ref), `Expected a branch ref, received "${ref}"`);
  return ref.replace(regex, "");
}

function getTagFromRef(ref: string): string {
  let regex = /^refs\/tags\//;
  invariant(regex.test(ref), `Expected a tag ref, received "${ref}"`);
  return ref.replace(regex, "");
}

function getVersionHead(ref: string): string {
  let version = getBranchOrTagFromRef(ref);
  let tag = semver.coerce(version);

  if (!tag) return version;

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
    let head = getVersionHead(`refs/tags/${version}`);

    return {
      head,
      version,
      isLatest: false,
    };
  });

  invariant(versions.length, "Expected at least one valid tag");

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
