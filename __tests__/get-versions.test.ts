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
});

it("throws an error when passed an invalid ref", () => {
  expect(() =>
    getBranchOrTagFromRef("something")
  ).toThrowErrorMatchingInlineSnapshot(
    `"Invariant failed: Expected a ref, received \\"something\\""`
  );
});

it("returns a branch", () => {
  expect(getBranchFromRef("refs/heads/master")).toBe("master");
  expect(getBranchFromRef("refs/heads/dev")).toBe("dev");
  expect(getBranchFromRef("refs/heads/main")).toBe("main");
});

it("throws an error when passed an invalid branch ref", () => {
  expect(() =>
    getBranchFromRef("refs/tags/v1.0.0")
  ).toThrowErrorMatchingInlineSnapshot(
    `"Invariant failed: Expected a branch ref, received \\"refs/tags/v1.0.0\\""`
  );
  expect(() =>
    getBranchFromRef("refs/tags/v1.0.0-beta.6")
  ).toThrowErrorMatchingInlineSnapshot(
    `"Invariant failed: Expected a branch ref, received \\"refs/tags/v1.0.0-beta.6\\""`
  );
  expect(() =>
    getBranchFromRef("something")
  ).toThrowErrorMatchingInlineSnapshot(
    `"Invariant failed: Expected a branch ref, received \\"something\\""`
  );
});

it("returns a tag", () => {
  expect(getTagFromRef("refs/tags/v1.0.0")).toBe("v1.0.0");
  expect(getTagFromRef("refs/tags/v1.0.0-beta.6")).toBe("v1.0.0-beta.6");
});

it("throws an error when passed an invalid tag ref", () => {
  expect(() =>
    getTagFromRef("refs/heads/master")
  ).toThrowErrorMatchingInlineSnapshot(
    `"Invariant failed: Expected a tag ref, received \\"refs/heads/master\\""`
  );
  expect(() => getTagFromRef("something")).toThrowErrorMatchingInlineSnapshot(
    `"Invariant failed: Expected a tag ref, received \\"something\\""`
  );
});

it("returns a version head", () => {
  expect(getVersionHead("refs/heads/master")).toBe("master");
  expect(getVersionHead("refs/heads/dev")).toBe("dev");
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
