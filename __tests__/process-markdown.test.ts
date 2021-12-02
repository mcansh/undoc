import fsp from "fs/promises";
import path from "path";
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

it("removes index.md and .md but keeps hash", () => {
  expect(cleanMarkdownPath("/foo/bar.md#something=true")).toBe(
    "/foo/bar#something=true"
  );
});

describe("processMarkdown", () => {
  let baseUrl = new URL("https://example.com/");

  it("processes markdown", async () => {
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

    let result3 = await processMarkdown(
      baseUrl,
      "some link -> [home](getting-started/overview.md)",
      {
        linkOriginPath: "/",
      }
    );

    expect(result3).toMatchInlineSnapshot(`
"<div class=\\"md-prose\\"><p>some link -> <a href=\\"/getting-started/overview\\">home</a></p></div>
"
`);
  });

  it("process markdown with external links", async () => {
    let markdown = await fsp.readFile(
      path.join(process.cwd(), "__fixtures__/examples/ssr/README.md"),
      "utf8"
    );

    let version = "6.0.2";

    let entry = {
      source: "/ssr/README.md",
      path: "/examples/ssr.md",
      content: markdown,
      lang: "en",
    };

    let linkOriginPath = `docs/${entry.lang}/${version}` + entry.path;

    let result = await processMarkdown(baseUrl, markdown, {
      linkOriginPath: "/",
      resolveHref(sourceHref) {
        if (
          !isRelativeUrl(sourceHref) ||
          sourceHref.startsWith("#") ||
          sourceHref.startsWith("?")
        ) {
          return false;
        }

        let currentUrl = getCurrentUrl(baseUrl, linkOriginPath);
        let href = cleanMarkdownPath(sourceHref);

        let from: string;
        let to: string;

        // If we're linking to another docs page, remove the directory from
        // the href path and resolve from the current URL
        if (href.startsWith("../../docs/") || href.startsWith("../docs/")) {
          from = addTrailingSlash(currentUrl.origin + currentUrl.pathname);
          to = href.replace("/docs/", "/");
        }

        // If not, we're linking to a file in the repo and should resolve
        // from the README in the repo's URL.
        else {
          let repoUrlSegment = cleanMarkdownPath(
            removeTrailingSlash(removeLeadingSlash(entry.path))
          );
          from = `https://github.com/remix-run/react-router/blob/main/${repoUrlSegment}/README.md`;
          to = sourceHref;
        }

        let resolved = resolveUrl(from, to);
        return resolved.href;
      },
    });

    expect(result).toMatchInlineSnapshot(`
"<div class=\\"md-prose\\"><hr><h2 id=\\"title-server-renderingtoc-false\\"><a href=\\"#title-server-renderingtoc-false\\" aria-hidden=\\"true\\" tabindex=\\"-1\\"><span class=\\"icon icon-link\\"></span></a>title: Server Rendering
toc: false</h2><h1 id=\\"server-side-rendering-example\\"><a href=\\"#server-side-rendering-example\\" aria-hidden=\\"true\\" tabindex=\\"-1\\"><span class=\\"icon icon-link\\"></span></a>Server-side Rendering Example</h1><p>This example adds <a href=\\"https://reactjs.org/docs/react-dom-server.html\\">server-side rendering</a> (SSR) to our basic example.</p><p>With SSR, the server renders your app and sends real HTML to the browser instead of an empty HTML document with a bunch of <code>&#x3C;script></code> tags. After the browser loads the HTML and JavaScript from the server, React \\"hydrates\\" the HTML document using the same components it used to render the app on the server.</p><p>This example contains a server (see <a href=\\"https://github.com/remix-run/react-router/blob/main/examples/ssr/server.js\\">server.js</a>) that can run in both development and production modes.</p><p>In the browser entry point (see <a href=\\"https://github.com/remix-run/react-router/blob/main/examples/ssr/src/entry.client.tsx\\">src/entry.client.tsx</a>), we use React Router like we would traditionally do in a purely client-side app and render a <code>&#x3C;BrowserRouter></code> to provide routing context to the rest of the app. The main difference is that instead of using <code>ReactDOM.render()</code> to render the app, since the HTML was already sent by the server, all we need is <code>ReactDOM.hydrate()</code>.</p><p>On the server (see <a href=\\"https://github.com/remix-run/react-router/blob/main/examples/ssr/src/entry.server.tsx\\">src/entry.server.tsx</a>), we use React Router's <code>&#x3C;StaticRouter></code> to render the app and plug in the URL we get from the incoming HTTP request.</p><h2 id=\\"preview\\"><a href=\\"#preview\\" aria-hidden=\\"true\\" tabindex=\\"-1\\"><span class=\\"icon icon-link\\"></span></a>Preview</h2><p>Open this example on <a href=\\"https://stackblitz.com\\">StackBlitz</a>:</p><p><a href=\\"https://stackblitz.com/github/remix-run/react-router/tree/main/examples/ssr?file=src/App.tsx\\"><img src=\\"https://developer.stackblitz.com/img/open_in_stackblitz.svg\\" alt=\\"Open in StackBlitz\\"></a></p></div>
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
