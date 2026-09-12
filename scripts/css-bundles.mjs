import { access, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import { build, transform } from "esbuild";

// These URLs are stable public entry points. Source manifests own cascade order.
export const CSS_BUNDLES = Object.freeze([
  {entry: "styles/site.css", minify: true},
]);

function localPath(root, importer, request) {
  if (/[?#\\]/.test(request) || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(request)) {
    throw new Error(`${importer}: only plain local CSS imports are supported: ${request}`);
  }
  const resolved = request.startsWith("/")
    ? path.resolve(root, `.${request}`)
    : path.resolve(root, path.dirname(importer), request);
  const relative = path.relative(root, resolved);
  if (relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) {
    throw new Error(`${importer}: CSS import escapes the site root: ${request}`);
  }
  return resolved;
}

export async function assembleCss(root, entry) {
  const sources = [];
  async function expand(file, stack = []) {
    if (stack.includes(file)) throw new Error(`CSS import cycle: ${[...stack, file].join(" -> ")}`);
    const input = await readFile(path.join(root, file), "utf8");
    const parsed = postcss.parse(input, { from: file });
    parsed.walkAtRules((rule) => {
      if (["charset", "namespace"].includes(rule.name.toLowerCase()) ||
          (rule.name.toLowerCase() === "import" && rule.parent !== parsed)) {
        throw new Error(`${file}: @${rule.name} requires a separate CSS packaging review`);
      }
    });
    let cursor = 0;
    let output = "";
    let hasRules = false;
    for (const node of parsed.nodes) {
      if (node.type === "comment") continue;
      if (node.type !== "atrule" || node.name !== "import") {
        hasRules = true;
        continue;
      }
      const match = !hasRules && !node.nodes && node.params.match(
        /^(?:"([^"\\]+)"|'([^'\\]+)'|url\(\s*"([^"\\]+)"\s*\)|url\(\s*'([^'\\]+)'\s*\))$/
      );
      if (!match) throw new Error(`${file}: expected leading unconditional local imports`);
      const request = match.slice(1).find((value) => value !== undefined);
      const imported = path.relative(root, localPath(root, file, request)).split(path.sep).join("/");
      // Do not deduplicate: the same file may deliberately occur at two cascade positions.
      const child = await expand(imported, [...stack, file]);
      sources.push({ file: imported, css: child });
      output += input.slice(cursor, node.source.start.offset) + child + "\n";
      cursor = node.source.end.offset;
    }
    return output + input.slice(cursor);
  }
  const css = await expand(entry);
  // Use the CSS parser/resolver only to validate, never to rewrite the raw bundle.
  // Relative assets would change their base URL after moving into the entry point.
  const checked = await build({
    stdin: { contents: css, loader: "css", sourcefile: entry, resolveDir: root },
    bundle: true,
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "preserve-css-resource-urls",
      setup(api) {
        api.onResolve({ filter: /.*/ }, ({ path: request, kind }) => {
          if (kind !== "url-token" || !/^(?:\/|[a-z][a-z\d+.-]*:)/i.test(request)) {
            return { errors: [{ text: `${entry}: relative CSS resource needs explicit rebasing: ${request}` }] };
          }
          return { path: request, external: true };
        });
      }
    }]
  });
  if (checked.warnings.length) {
    throw new Error(`${entry}: CSS validation warnings: ${checked.warnings.map((warning) => warning.text).join("; ")}`);
  }
  return { css, sources };
}

export async function renderCssBundle(root, config) {
  const assembled = await assembleCss(root, config.entry);
  // Preserve the established minified public stylesheet.
  const css = config.minify
    ? (await transform(assembled.css, { loader: "css", minify: true })).code
    : assembled.css;
  return { ...assembled, css };
}

export async function bundleSiteStyles({ root, dist }) {
  await checkCssEntryCoverage(dist);
  // Validate all entries before replacing any copied output.
  const bundles = await Promise.all(CSS_BUNDLES.map(async (config) => {
    const bundle = await renderCssBundle(root, config);
    for (const file of new Set(bundle.sources.map((source) => source.file))) {
      try { await access(path.join(dist, file)); }
      catch { throw new Error(`${config.entry}: dependency is outside the public artifact: ${file}`); }
    }
    return { ...config, ...bundle };
  }));
  for (const bundle of bundles) {
    await writeFile(path.join(dist, bundle.entry), bundle.css, "utf8");
    console.log(`CSS: ${bundle.entry} (${bundle.sources.length} imports -> 1 stylesheet)`);
  }
}

// Scan the actual public artifact, not a second copy of the hosting allowlist.
// A new import-bearing entry must be registered; standalone CSS stays byte-identical.
export async function checkCssEntryCoverage(directory) {
  const registered = new Set(CSS_BUNDLES.map(({ entry }) => entry));
  async function visit(folder) {
    for (const item of await readdir(folder, { withFileTypes: true })) {
      const file = path.join(folder, item.name);
      if (item.isDirectory()) await visit(file);
      else if (item.name.endsWith(".css")) {
        const css = postcss.parse(await readFile(file, "utf8"));
        const entry = path.relative(directory, file).split(path.sep).join("/");
        if (css.nodes.some((node) => node.type === "atrule" && node.name === "import") && !registered.has(entry)) {
          throw new Error(`${entry}: register this import-bearing public stylesheet in CSS_BUNDLES`);
        }
      }
    }
  }
  await visit(directory);
}
