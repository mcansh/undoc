import { URL } from "url";

import { processMarkdown } from "@ryanflorence/md";

/**
 *
 * @param {URL} baseUrl the base URL of the site
 * @param {string} content markdown content
 * @param opts
 * opts.linkOriginPath {string} the path to the current page, if any
 * opts.preserveLinks {boolean} preserve links without rewriting them
 * @returns {string} the processed markdown content
 */
async function reactRouterProcessMarkdown(
  baseUrl: URL,
  content: string,
  opts: { linkOriginPath: string; preserveLinks?: boolean }
): Promise<string> {
  let preserveLinks = opts.preserveLinks ?? false;

  return processMarkdown(content, {
    /*
     * If you're new here, I bet you wanna know what's going on. Well pull up a
     * chair, grab a tasty snack and let's talk about it.
     *
     * So we like to keep our docs in the `react-router` repo as markdown files.
     * This makes it super easy for users who are browsing around the code to
     * see the docs right there in the source. That's pretty handy!
     *
     * If you're browsing around the docs in GitHub, you might see a link from
     * one doc to another. In markdown that would look something like this:
     *
     * > Check out our [API docs](../api.md)
     *
     * GitHub is going to resolve that link based on the file structure of the
     * repo, and so long as that file exists relative to the file in which the
     * Markdown is rendered, everything works. Splendid.
     *
     * When we build our database from the RR repo, we process the markdown
     * content and turn it into HTML using a bunch of fancy tools tucked away in
     * Ryan's `@ryanflorence/md` project. That tool is external and doesn't
     * really know how we're using it -- it simply converts the markdown into
     * HTML and spits it back to us. But we need to make some changes, because
     * the way the links are resolved on GitHub doesn't necessarily work on our
     * site once they are converted to HTML.
     *
     * First of all, none of the internal links on the site will have a `.md`
     * extension. Second, `index.md` files will appear without the `index` path
     * segment, meaning relative links to (and from) index files will look a bit
     * different.
     *
     * To make these tweaks, Ryan's `md` tool provides a `resolveHref` hook that
     * gives us direct access to the `href` value of all relative links it
     * encounters while parsing. We can manipulate it based on our site's route
     * structure. This means that markdown links always work in GitHub when
     * browsing the markdown files directly as well as our docs site.
     */
    resolveHref(sourceHref) {
      if (
        preserveLinks ||
        !isRelativeUrl(sourceHref) ||
        sourceHref.startsWith("#") ||
        sourceHref.startsWith("?")
      ) {
        return sourceHref;
      }

      // To resolve the correct href, we need to know the URL of the page the
      // link appears on. We also need to know if it's coming from an index
      // route.
      let currentUrl = getCurrentUrl(baseUrl, opts.linkOriginPath);
      let currentUrlIsIndex = isIndexPath(opts.linkOriginPath);

      let href = cleanMarkdownPath(sourceHref);

      try {
        let from = addTrailingSlash(currentUrl.origin + currentUrl.pathname);
        let to =
          href.startsWith("/") || currentUrlIsIndex ? href : `../${href}`;
        let resolved = resolveUrl(from, to);
        return resolved.pathname + resolved.search + resolved.hash;
      } catch (_) {
        // who knows 🤷‍♂️, do nothing and we'll just return what they gave us
      }

      return href;
    },
  });
}

function getCurrentUrl(baseUrl: URL, pathFromServer?: string | undefined): URL {
  if (!pathFromServer) {
    throw Error(
      "Resolving the current URL depends on a source path when called from the server."
    );
  }

  let withNoTrailingSlash = removeTrailingSlash(pathFromServer);
  let withLeadingSlash = removeLeadingSlash(withNoTrailingSlash);
  let toPath = cleanMarkdownPath(withLeadingSlash);

  return resolveUrl(baseUrl.origin, toPath);
}

function isRelativeUrl(test: string): boolean {
  let regexp = new RegExp("^((?:[a-z]+:)?//|mailto:|tel:)", "i");
  return !regexp.test(test);
}

function resolveUrl(from: string, to: string): URL {
  try {
    let resolvedUrl = new URL(to, new URL(from, "resolve://"));
    if (resolvedUrl.protocol === "resolve:") {
      let { pathname, search, hash } = resolvedUrl;
      return new URL(pathname + search + hash);
    }
    return resolvedUrl;
  } catch (e) {
    if (
      e instanceof TypeError &&
      e.toString() === "TypeError: Failed to construct 'URL': Invalid URL"
    ) {
      throw TypeError(
        "Failed to resolve URLs. The `from` argument is an invalid URL."
      );
    }
    throw e;
  }
}

function cleanMarkdownPath(str: string): string {
  // Strips `index.md` or just the `.md` extension
  let regex = /((\/index)?\.md$|(\/index)?\.md(#))/;
  if (regex.test(str)) {
    return str.replace(regex, "$4");
  }
  return str;
}

function isIndexPath(str?: string | undefined): boolean {
  if (!str) return false;
  let regex = /(\/index(\.md)?$|\/index(\.md)?(#))/;
  return regex.test(removeLeadingSlash(removeTrailingSlash(str)));
}

function removeLeadingSlash(str: string): string {
  return str.replace(/^\/+/, "");
}

function removeTrailingSlash(str: string): string {
  return str.replace(/\/+$/, "");
}

function addTrailingSlash(str: string): string {
  return removeTrailingSlash(str) + "/";
}

export {
  reactRouterProcessMarkdown as processMarkdown,
  getCurrentUrl,
  isRelativeUrl,
  resolveUrl,
  cleanMarkdownPath,
  isIndexPath,
  removeLeadingSlash,
  removeTrailingSlash,
  addTrailingSlash,
};
export { remarkCodeBlocksShiki } from "@ryanflorence/md";
