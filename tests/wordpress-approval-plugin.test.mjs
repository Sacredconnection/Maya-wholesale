import { spawnSync } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pluginFiles = [
  "integrations/wordpress/maya-wholesale-admin-tools/maya-wholesale-admin-tools.php",
  "integrations/wordpress/maya-wholesale-core/maya-wholesale-core.php",
];

for (const pluginFile of pluginFiles) {
  test(`${pluginFile} keeps approval synchronized with the WordPress role`, async () => {
    const source = await readFile(pluginFile, "utf8");

    assert.match(source, /add_role\(\s*'pending'/s);
    assert.match(
      source,
      /update_user_meta\( \$user_id, 'sc_approval_status', 'approved' \)/
    );
    assert.match(
      source,
      /update_user_meta\( \$user_id, 'maya_account_status', 'approved' \)/
    );
    assert.match(
      source,
      /update_user_meta\( \$user_id, 'pw_user_status', 'approved' \)/
    );
    assert.doesNotMatch(source, /array\( 'pending', 'customer' \)/);
    assert.match(source, /'user_row_actions'/);
    assert.match(source, /'handle_bulk_actions-users'/);
    assert.match(source, /'woocommerce_sacred_wholesale_customer_approved'/);
  });
}

const php = process.env.PHP_BINARY || "php";
const phpAvailable = spawnSync(php, ["-v"]).status === 0;
for (const [index, pluginFile] of pluginFiles.entries()) {
  for (const rest of [false, true]) {
    test(pluginFile + " enforces manual approval" + (rest ? " through REST" : " in WordPress"), { skip: !phpAvailable && "Set PHP_BINARY to run PHP hook tests" }, () => {
      const result = spawnSync(php, ["tests/fixtures/wordpress-approval.php", pluginFile, index === 0 ? "maya_wholesale" : "maya_wholesale_core", ...(rest ? ["--rest"] : [])], { encoding: "utf8" });
      assert.equal(result.status, 0, result.stdout + result.stderr);
    });
  }
}
