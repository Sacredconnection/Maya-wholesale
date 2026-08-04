"use client";

export const ORDER_WORKBOOK_MARKER = "MAYA_HERBS_ORDER_WORKBOOK";
export const ORDER_WORKBOOK_VERSION = "1";
export const ORDER_WORKBOOK_META_SHEET = "_MAYA_ORDER";
export const ORDER_ITEM_HEADER = "_MAYA_IMPORT_ITEM";

export const catalogOrderItemToken = (product, option) =>
  JSON.stringify({
    storeId: String(product.storeId || "maya-herbs").slice(0, 64),
    sku: String(option.sku || "").slice(0, 100),
  });

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_ROWS = 10_000;
const MAX_LINES = 100;
const scalar = (cell) => {
  const value = cell?.value;
  return value && typeof value === "object" && "result" in value ? value.result : value ?? "";
};

export async function readCatalogOrderWorkbook(file) {
  if (!file?.arrayBuffer) throw new Error("Choose a valid Excel workbook.");
  if (file.size > MAX_BYTES) throw new Error("The spreadsheet is too large. The maximum file size is 10 MB.");
  const ExcelJS = await import("exceljs");
  const Workbook = ExcelJS.Workbook || ExcelJS.default?.Workbook;
  const workbook = new Workbook();
  try { await workbook.xlsx.load(await file.arrayBuffer()); } catch { throw new Error("The Excel workbook could not be read."); }
  const metadata = workbook.getWorksheet(ORDER_WORKBOOK_META_SHEET);
  if (!metadata || String(metadata.getCell("B1").value || "") !== ORDER_WORKBOOK_MARKER || String(metadata.getCell("B2").value || "") !== ORDER_WORKBOOK_VERSION) {
    throw new Error("This is not a Maya Herbs order workbook. Download a new spreadsheet from the digital catalog.");
  }
  const sheet = workbook.worksheets.find((item) => item.name === "Order");
  if (!sheet) throw new Error("The order worksheet is missing.");
  let quantityColumn = 0;
  let itemColumn = 0;
  sheet.getRow(5).eachCell({ includeEmpty: true }, (cell, column) => {
    const header = String(scalar(cell)).trim();
    if (header === "Quantidade") quantityColumn = column;
    if (header === ORDER_ITEM_HEADER) itemColumn = column;
  });
  if (!quantityColumn || !itemColumn) throw new Error("The order workbook is missing required columns.");
  const selected = new Map();
  for (let rowNumber = 6; rowNumber <= sheet.actualRowCount && rowNumber < MAX_ROWS + 6; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const quantity = Number(scalar(row.getCell(quantityColumn)) || 0);
    if (quantity === 0) continue;
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000) throw new Error(`Invalid quantity in row ${rowNumber}. Use a whole number from 1 to 1000.`);
    let item;
    try { item = JSON.parse(String(scalar(row.getCell(itemColumn)))); } catch { throw new Error(`Invalid product reference in row ${rowNumber}.`); }
    const storeId = String(item?.storeId || "").trim();
    const sku = String(item?.sku || "").trim();
    if (!storeId || !sku) throw new Error(`Invalid product reference in row ${rowNumber}.`);
    const key = `${storeId}\u0000${sku.toLowerCase()}`;
    const nextQuantity = (selected.get(key)?.quantity || 0) + quantity;
    if (nextQuantity > 1000) throw new Error(`The combined quantity for SKU ${sku} exceeds 1000.`);
    selected.set(key, { storeId, sku, quantity: nextQuantity });
    if (selected.size > MAX_LINES) throw new Error("Select no more than 100 different products per order.");
  }
  if (!selected.size) throw new Error("Enter a quantity for at least one product before importing.");
  return [...selected.values()];
}
