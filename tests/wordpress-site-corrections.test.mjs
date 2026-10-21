import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("WordPress correction plugin preserves retail emails and existing security routes", { skip: !process.env.PHP_BINARY && "Set PHP_BINARY to run PHP hook tests" }, () => {
  const output = execFileSync(process.env.PHP_BINARY, [fileURLToPath(new URL("./fixtures/site-corrections.php", import.meta.url)), fileURLToPath(new URL("../integrations/wordpress/maya-wholesale-site-corrections/maya-wholesale-site-corrections.php", import.meta.url))], { encoding: "utf8" });
  assert.match(output, /PASS: private auth/);
});
