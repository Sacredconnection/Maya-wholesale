import { readFile } from "node:fs/promises";
import vm from "node:vm";

// Execute actual handler code with isolated dependencies; never call live backends.
export async function loadModule(path, names, stubs = {}) {
  const source = (await readFile(new URL("../../" + path, import.meta.url), "utf8"))
    .replace(/^import[\s\S]*?;\s*$/gm, "")
    .replace(/^export \{[^}]*\} from [^\n]+/gm, "")
    .replace(/^export (?=async function|function|const|class)/gm, "");
  return vm.runInNewContext(source + "\n({" + names.join(",") + "})", {
    Buffer, Response, Request, Headers, File, URL, URLSearchParams, AbortSignal,
    console: { error() {}, warn() {} }, process: { env: {} }, ...stubs,
  }, { filename: path });
}
