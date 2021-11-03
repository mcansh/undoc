import { URL } from "url";
import {
  addTrailingSlash,
  cleanMarkdownPath,
  getCurrentUrl,
  isIndexPath,
  isRelativeUrl,
  processMarkdown,
  removeLeadingSlash,
  removeTrailingSlash,
  resolveUrl,
} from "../src/lib/process-markdown";

describe("slash utilities", () => {
  it("removes trailing slashes from links", () => {
    expect(removeTrailingSlash("/foo/bar/")).toBe("/foo/bar");
  });

  it("removes leading slash", () => {
    expect(removeLeadingSlash("/foo/bar")).toBe("foo/bar");
  });

  it("adds a trailing slash", () => {
    expect(addTrailingSlash("/foo/bar")).toBe("/foo/bar/");
  });
});

describe("getCurrentUrl", () => {
  let baseUrl = new URL("https://example.com/");

  it("returns the current url", () => {
    expect(getCurrentUrl(baseUrl, "/")).toMatchInlineSnapshot(
      `"https://example.com/"`
    );
    expect(getCurrentUrl(baseUrl, "/some/nested/page")).toMatchInlineSnapshot(
      `"https://example.com/some/nested/page"`
    );
  });

  it("throws an error if no pathFromServer is provided", () => {
    expect(() => getCurrentUrl(baseUrl)).toThrowError(
      "Resolving the current URL depends on a source path when called from the server."
    );
  });
});

it("removes index.md from links", () => {
  expect(cleanMarkdownPath("/foo/bar/index.md")).toBe("/foo/bar");
});

it("removes .md from links", () => {
  expect(cleanMarkdownPath("/foo/bar.md")).toBe("/foo/bar");
});

describe("processMarkdown", () => {
  it("processes markdown", async () => {
    let baseUrl = new URL("https://example.com/");
    let result = await processMarkdown(
      baseUrl,
      "### Hello world\n check this out! [something](./my-post.md)",
      { linkOriginPath: "/" }
    );

    expect(result).toMatchInlineSnapshot(`
"<div class=\\"md-prose\\"><h3 id=\\"hello-world\\"><a href=\\"#hello-world\\" aria-hidden=\\"true\\" tabindex=\\"-1\\"><span class=\\"icon icon-link\\"></span></a>Hello world</h3><p>check this out! <a href=\\"/my-post\\">something</a></p></div>
"
`);

    let result2 = await processMarkdown(
      baseUrl,
      "### Hello world\n check this out! [something](../my-post.md)",
      {
        linkOriginPath: "/some/nested/page/",
      }
    );

    expect(result2).toMatchInlineSnapshot(`
"<div class=\\"md-prose\\"><h3 id=\\"hello-world\\"><a href=\\"#hello-world\\" aria-hidden=\\"true\\" tabindex=\\"-1\\"><span class=\\"icon icon-link\\"></span></a>Hello world</h3><p>check this out! <a href=\\"/some/my-post\\">something</a></p></div>
"
`);
  });
});

describe("isRelativeUrl", () => {
  it("returns whether or not a url is relative", () => {
    expect(isRelativeUrl("/foo/bar")).toBe(true);
    expect(isRelativeUrl("https://example.com/foo/bar")).toBe(false);
    expect(isRelativeUrl("../foo/bar")).toBe(true);
    expect(isRelativeUrl("mailto:something@something.com")).toBe(false);
    expect(isRelativeUrl("tel:1800nahfam")).toBe(false);
  });
});
