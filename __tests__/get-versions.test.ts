import {
  getBranchFromRef,
  getBranchOrTagFromRef,
  getTagFromRef,
  getVersionHead,
  getVersions,
} from "../src/lib/get-versions";

it("returns the branch or tag", () => {
  expect(getBranchOrTagFromRef("refs/heads/master")).toBe("master");
  expect(getBranchOrTagFromRef("refs/tags/v1.0.0")).toBe("v1.0.0");
  expect(getBranchOrTagFromRef("refs/tags/v1.0.0-beta.6")).toBe(
    "v1.0.0-beta.6"
  );
  expect(getBranchOrTagFromRef("something")).toBe("something");
});
it("returns a branch", () => {
  expect(getBranchFromRef("refs/heads/master")).toBe("master");
  expect(getBranchFromRef("refs/tags/v1.0.0")).toBe("refs/tags/v1.0.0");
  expect(getBranchFromRef("refs/tags/v1.0.0-beta.6")).toBe(
    "refs/tags/v1.0.0-beta.6"
  );
  expect(getBranchFromRef("something")).toBe("something");
});
it("returns a tag", () => {
  expect(getTagFromRef("refs/tags/v1.0.0")).toBe("v1.0.0");
  expect(getTagFromRef("refs/tags/v1.0.0-beta.6")).toBe("v1.0.0-beta.6");
  expect(getTagFromRef("refs/heads/master")).toBe("refs/heads/master");
  expect(getTagFromRef("something")).toBe("something");
});

it("returns a version head", () => {
  expect(() => getVersionHead("refs/heads/master")).toThrowError();
  expect(getVersionHead("refs/tags/v0.0.1")).toBe("v0.0.1");
  expect(getVersionHead("refs/tags/v0.0.1-beta.6")).toBe("v0.0.1");
  expect(getVersionHead("refs/tags/v0.1.0")).toBe("v0.1");
  expect(getVersionHead("refs/tags/v1.0.0")).toBe("v1");
});

it("returns a VersionHead for each version", () => {
  let versions = getVersions([
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
