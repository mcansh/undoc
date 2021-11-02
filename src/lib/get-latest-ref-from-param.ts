import { getRefFromParam } from "./get-ref-from-param";

/**
 *
 * @param {string} refParam either a full version like v1.0.0 or a head like master or v6
 * @param {Array<string>} refs an array of refs to check against the refParam (e.g. ["master", "v1.0.0"])
 * @returns {string | null} the latest ref from the refs array that matches the refParam
 */
async function getLatestRefFromParam(
  refParam: string,
  refs: Array<string>
): Promise<string | null> {
  let refValues = refs.map((ref) => ref.replace(/^refs\/(heads|tags)\//, ""));

  let version = getRefFromParam(
    refParam,
    refValues,
    process.env.REPO_LATEST_BRANCH!
  );

  if (!version) return null;

  return version;
}

export { getLatestRefFromParam };
