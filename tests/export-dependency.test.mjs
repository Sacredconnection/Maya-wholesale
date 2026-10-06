import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";

test("Excel export retains conditional formatting after the UUID security update", async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Order");
  sheet.addRows([[1], [2], [3]]);
  // The extended icon set exercises ExcelJS's UUID v4 call.
  sheet.addConditionalFormatting({ ref: "A1:A3", rules: [{ type: "iconSet", iconSet: "3Stars", cfvo: [{ type: "percent", value: 0 }, { type: "percent", value: 33 }, { type: "percent", value: 67 }] }] });
  const bytes = await workbook.xlsx.writeBuffer();
  const read = new ExcelJS.Workbook();
  await read.xlsx.load(bytes);
  assert.equal(read.getWorksheet("Order").getCell("A2").value, 2);
  assert.equal(read.getWorksheet("Order").conditionalFormattings[0].rules[0].iconSet, "3Stars");
});
