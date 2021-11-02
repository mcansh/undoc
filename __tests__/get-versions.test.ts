import { getVersions } from "../src";

it("returns a VersionHead for each version", () => {
  const versions = getVersions([
    "refs/heads/main",
    "refs/tags/v0.20.1",
    "refs/tags/v0.20.0",
    "refs/tags/v0.17.5",
  ]);

  expect(versions).toHaveLength(3);
  expect(versions).toEqual([
    {
      head: "v0.20",
      version: "v0.20.1",
      isLatest: true,
    },
    {
      head: "v0.20",
      version: "v0.20.0",
      isLatest: false,
    },
    {
      head: "v0.17",
      version: "v0.17.5",
      isLatest: false,
    },
  ]);
});
