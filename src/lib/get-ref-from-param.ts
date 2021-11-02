import * as semver from "semver";

/**
 *
 * @param {string} refParam the head or full version in the url (e.g. v6 or v6.0.1)
 * @param {Array<string>} refs an array of full versions or branch names
 * @param {string} latestBranchRef the branch ref you want the latest version to map to
 * @returns {string | null}
 */
function getRefFromParam(
  refParam: string,
  refs: Array<string>,
  latestBranchRef: string
): string | null {
  if (refs.length === 0) {
    throw new Error("No refs found");
  }

  if (refs.includes(refParam)) {
    let validVersion = semver.valid(refParam);
    return validVersion
      ? `refs/tags/v${validVersion}`
      : `refs/heads/${refParam}`;
  }

  let [latestTag] = refs
    .filter((ref) => semver.valid(ref))
    .sort(semver.rcompare);

  if (!latestTag) {
    throw new Error("No latest ref found");
  }

  if (semver.satisfies(latestTag, refParam, { includePrerelease: true })) {
    return latestBranchRef;
  }

  let maxSatisfying = semver.maxSatisfying(refs, refParam, {
    includePrerelease: true,
  });

  if (maxSatisfying) {
    return `refs/tags/${maxSatisfying}`;
  }

  return null;
}

export { getRefFromParam };
