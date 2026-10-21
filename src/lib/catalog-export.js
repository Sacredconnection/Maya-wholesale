"use client";

import { categoryLabel, compareCategories, compareCatalogProducts, catalogGroups, productFormats } from "@/lib/catalog-organization.mjs";
import { optionPriceForUser } from "@/lib/pricing";
import {
  catalogOrderItemToken,
  ORDER_ITEM_HEADER,
  ORDER_WORKBOOK_MARKER,
  ORDER_WORKBOOK_META_SHEET,
  ORDER_WORKBOOK_VERSION,
} from "@/lib/catalog-order-workbook";

const BRAND_DARK = "FF1A1A1A";
const BRAND_GREEN = "FF999933";
const BRAND_MINT = "FFF2F2F2";
const BRAND_RED = "FFCC6633";

const MAYA_PRIMARY = [204, 102, 51];
const MAYA_SECONDARY = [153, 153, 51];
const MAYA_STORE_ID = "maya-herbs";

const safeFilenameDate = () => new Date().toISOString().slice(0, 10);

const safeFilenameTimestamp = (date) =>
  date.toISOString().replace(/\..+$/, "").replace(/[:T]/g, "-");

const formatPdfGenerationTimestamp = (date) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  }).format(date);

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function usesMobilePdfPreview() {
  const userAgentDataMobile = navigator.userAgentData?.mobile === true;
  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const touchEnabledIpad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return userAgentDataMobile || mobileUserAgent || touchEnabledIpad;
}

function preparePdfDelivery() {
  if (usesMobilePdfPreview()) {
    return { mode: "preview" };
  }

  const previewWindow = window.open("", "_blank");
  if (!previewWindow) {
    return { mode: "preview" };
  }

  previewWindow.document.title = "Generating PDF catalog";
  previewWindow.document.body.innerHTML = `
    <main style="box-sizing:border-box;min-height:100vh;display:grid;place-items:center;margin:0;padding:32px;background:#242f27;color:#fff;font-family:Arial,sans-serif;text-align:center">
      <div>
        <div style="width:44px;height:44px;margin:0 auto 24px;border:4px solid rgba(153,153,51,.25);border-top-color:#f2f2f2;border-radius:50%;animation:catalog-spin .8s linear infinite"></div>
        <h1 style="margin:0;font-size:24px">Generating your PDF catalog...</h1>
        <p style="margin:14px 0 0;color:rgba(255,255,255,.72);font-size:16px;line-height:1.6">Please keep this tab open. The document will appear here when it is ready.</p>
      </div>
      <style>@keyframes catalog-spin{to{transform:rotate(360deg)}}</style>
    </main>`;

  return { mode: "window", previewWindow };
}

function showPdfDeliveryError(delivery) {
  if (delivery?.mode !== "window" || delivery.previewWindow.closed) return;

  delivery.previewWindow.document.title = "PDF generation failed";
  delivery.previewWindow.document.body.innerHTML = `
    <main style="box-sizing:border-box;min-height:100vh;display:grid;place-items:center;margin:0;padding:32px;background:#242f27;color:#fff;font-family:Arial,sans-serif;text-align:center">
      <div>
        <h1 style="margin:0;font-size:24px">The PDF could not be generated</h1>
        <p style="margin:14px 0 0;color:rgba(255,255,255,.72);font-size:16px;line-height:1.6">Please close this tab and try again from the digital catalog.</p>
      </div>
    </main>`;
}

async function deliverPdf(pdf, filename, delivery) {
  const blob = pdf.output("blob");

  if (delivery?.mode === "window" && !delivery.previewWindow.closed) {
    const url = URL.createObjectURL(blob);
    delivery.previewWindow.location.replace(url);
    window.setTimeout(() => URL.revokeObjectURL(url), 300000);
    return;
  }

  if (delivery?.mode === "preview" || usesMobilePdfPreview()) {
    const url = URL.createObjectURL(blob);
    // Keep generation in the foreground on tablets. Opening a placeholder tab
    // before the async work finishes can suspend the source page on iPadOS.
    // The native PDF viewer then provides Share / Save to Files.
    window.location.assign(url);
    return;
  }

  downloadBlob(blob, filename);
}

function catalogRows(products, user) {
  return products.flatMap((product) => {
    const options = product.options?.length ? product.options : [{}];
    return options.map((option) => ({
      sku: option.sku || product.sku || "",
      product: product.name || "",
      category: [product.category, product.subcategory || product.tribe, product.childCategory].filter(Boolean).map(categoryLabel).join(" / "),
      option: option.name || "Single format",
      weight: Number(option.weightGrams) || null,
      price: optionPriceForUser(option, user, product.category),
      importToken: catalogOrderItemToken(product, option),
      description: product.description || "",
      productUrl: product.productUrl || "",
    }));
  });
}

export async function createCatalogOrderWorkbook({ products, user, includeLinks, origin = "https://wholesale.mayaherbs.com" }) {
  const ExcelJS = await import("exceljs");
  const Workbook = ExcelJS.Workbook || ExcelJS.default?.Workbook;
  const workbook = new Workbook();
  workbook.creator = "Maya Herbs Wholesale";
  workbook.created = new Date();
  workbook.modified = new Date();
  const metadata = workbook.addWorksheet(ORDER_WORKBOOK_META_SHEET, { state: "veryHidden" });
  metadata.getCell("B1").value = ORDER_WORKBOOK_MARKER;
  metadata.getCell("B2").value = ORDER_WORKBOOK_VERSION;

  const instructions = workbook.addWorksheet("Instructions", {
    views: [{ showGridLines: false }],
  });
  instructions.columns = [
    { width: 4 },
    { width: 24 },
    { width: 76 },
  ];
  instructions.mergeCells("B2:C2");
  instructions.getCell("B2").value = "MAYA HERBS - ORDER WORKBOOK";
  instructions.getCell("B2").font = { bold: true, size: 18, color: { argb: "FFFFFFFF" } };
  instructions.getCell("B2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_GREEN } };
  instructions.getCell("B2").alignment = { vertical: "middle" };
  instructions.getRow(2).height = 36;

  const guidance = [
    ["1", "Open a category tab and locate products by SKU, name or size."],
    ["2", "Enter quantities in the Quantity column (whole numbers from 0 to 1000). Keep SKU values unchanged."],
    ["3", "Product descriptions and available sizes are provided for reference."],
    ["4", "Rows with quantity zero are ignored when the order file is imported."],
    ["5", "Save this workbook, then use Import Order Excel in the online catalog. Review the cart before submitting. Prices are estimates in EUR; current account and volume prices are recalculated on import."],
  ];
  instructions.getCell("B4").value = "HOW TO USE";
  instructions.getCell("B4").font = { bold: true, color: { argb: BRAND_GREEN } };
  guidance.forEach(([step, text], index) => {
    const row = 5 + index;
    instructions.getCell(row, 2).value = step;
    instructions.getCell(row, 2).font = { bold: true, color: { argb: BRAND_RED } };
    instructions.getCell(row, 3).value = text;
    instructions.getCell(row, 3).alignment = { wrapText: true, vertical: "top" };
    instructions.getRow(row).height = Math.max(30, Math.ceil(text.length / 70) * 16);
  });
  instructions.getCell("B12").value = "Generated";
  instructions.getCell("C12").value = new Date();
  instructions.getCell("C12").numFmt = "yyyy-mm-dd hh:mm";

  const categoryNames = [...new Set(products.map(product => categoryLabel(product.category)))].sort(compareCategories);
  const usedNames = new Set([ORDER_WORKBOOK_META_SHEET.toLowerCase(), "instructions"]);
  for (const category of categoryNames) {
  const categoryProducts = products.filter(product => categoryLabel(product.category) === category).sort(compareCatalogProducts);
  const baseName = category.replace(/[\\/*?:\[\]]/g, " ").replace(/^'+|'+$/g, "").slice(0, 31) || "Products";
  let sheetName = baseName;
  for (let i = 2; usedNames.has(sheetName.toLowerCase()); i++) sheetName = baseName.slice(0, 27) + " " + i;
  usedNames.add(sheetName.toLowerCase());
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 5, showGridLines: false }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });
  sheet.columns = [
    { key: "sku", width: 24 },
    { key: "quantity", width: 14 },
    { key: "description", width: 28 },
    { key: "product", width: 42 },
    { key: "category", width: 22 },
    { key: "option", width: 22 },
    { key: "weight", width: 13 },
    { key: "price", width: 19 },
    { key: "subtotal", width: 19 },
    { key: "link", width: 18 },
  ];

  sheet.mergeCells("A1:J1");
  sheet.getCell("A1").value = "MAYA HERBS WHOLESALE ORDER - " + category;
  sheet.getCell("A1").font = { bold: true, size: 18, color: { argb: "FFFFFFFF" } };
  sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
  sheet.getCell("A1").alignment = { vertical: "middle" };
  sheet.getRow(1).height = 38;

  sheet.mergeCells("A2:J2");
  sheet.getCell("A2").value = "Enter quantities only. Keep product references unchanged. Import the workbook to review current prices.";
  sheet.getCell("A2").font = { italic: true, color: { argb: "FF4F625D" } };
  sheet.getCell("A2").alignment = { vertical: "middle" };
  sheet.getRow(2).height = 25;

  sheet.getCell("A3").value = "Products / variations";
  sheet.getCell("B3").value = catalogRows(categoryProducts, user).length;
  sheet.getCell("D3").value = "Catalog products";
  sheet.getCell("E3").value = categoryProducts.length;
  ["A3", "D3"].forEach((address) => {
    sheet.getCell(address).font = { bold: true, color: { argb: BRAND_GREEN } };
  });

  const headers = [
    "SKU",
    "Quantity",
    "Description",
    "Product",
    "Category / subcategory",
    "Size / option",
    "Weight (g)",
    "Unit price (EUR)",
    "Subtotal (EUR)",
    "Product on website",
    ORDER_ITEM_HEADER,
  ];
  sheet.getRow(5).values = headers;
  sheet.getRow(5).height = 30;
  sheet.getRow(5).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_GREEN } };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border = { bottom: { style: "medium", color: { argb: BRAND_MINT } } };
  });

  const rows = catalogRows(categoryProducts, user);
  rows.forEach((item, index) => {
    const rowNumber = index + 6;
    const row = sheet.getRow(rowNumber);
    row.values = [
      item.sku,
      0,
      item.description,
      item.product,
      item.category,
      item.option,
      item.weight,
      item.price,
      { formula: `IF(B${rowNumber}>0,B${rowNumber}*H${rowNumber},"")` },
      "",
      item.importToken,
    ];
    row.height = Math.min(409, Math.max(60, Math.ceil(item.description.length / 28) * 15));
    row.alignment = { vertical: "middle", wrapText: true };
    row.getCell(1).numFmt = "@";
    row.getCell(2).numFmt = "0";
    row.getCell(2).dataValidation = {
      type: "whole",
      operator: "between",
      allowBlank: true,
      formulae: [0, 1000],
      showErrorMessage: true,
      errorTitle: "Invalid quantity",
      error: "Enter a whole number from 0 to 1000.",
    };
    row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };
    row.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF9E8" } };
    row.getCell(8).numFmt = '"€"#,##0.00';
    row.getCell(9).numFmt = '"€"#,##0.00';
    if (includeLinks && item.productUrl) {
      row.getCell(10).value = {
        text: "Open product",
        hyperlink: new URL(item.productUrl, origin).href,
      };
      row.getCell(10).font = { color: { argb: BRAND_GREEN }, underline: true };
    } else {
      row.getCell(10).value = "Login required";
      row.getCell(10).font = { italic: true, color: { argb: "FF7A7A7A" } };
    }
    if (index % 2 === 1) {
      [1, 4, 5, 6, 7, 8, 9, 10].forEach((column) => {
        row.getCell(column).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F7F6" } };
      });
    }
  });

  const firstDataRow = 6;
  const lastDataRow = Math.max(firstDataRow, rows.length + 5);
  const totalRow = lastDataRow + 2;
  sheet.getCell(totalRow, 1).value = "ORDER TOTAL";
  sheet.getCell(totalRow, 1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getCell(totalRow, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
  sheet.getCell(totalRow, 2).value = { formula: `SUM(B${firstDataRow}:B${lastDataRow})` };
  sheet.getCell(totalRow, 2).font = { bold: true };
  sheet.getCell(totalRow, 9).value = { formula: `SUM(I${firstDataRow}:I${lastDataRow})` };
  sheet.getCell(totalRow, 9).font = { bold: true, color: { argb: BRAND_RED } };
  sheet.getCell(totalRow, 9).numFmt = '"€"#,##0.00';
  sheet.autoFilter = { from: "A5", to: `J${lastDataRow}` };
  sheet.getColumn(11).hidden = true;

  }
  return workbook;
}

export async function exportCatalogExcel(options) {
  const workbook = await createCatalogOrderWorkbook({ ...options, origin: window.location.origin });
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `maya-herbs-order-${safeFilenameDate()}.xlsx`
  );
}

const pdfSafeText = (value) => {
  const normalized = String(value ?? "")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u00A0\u2007\u202F]/g, " ")
    .replace(/[\u2022\u00B7]/g, "-");
  return Array.from(normalized, (character) => {
    if (character.codePointAt(0) <= 255) return character;
    const latinFallback = character
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\u0020-\u00ff]/g, "");
    return latinFallback || "?";
  }).join("");
};

function plainPdfText(value) {
  if (!value) return "";
  const textarea = document.createElement("textarea");
  textarea.innerHTML = String(value).replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n");
  return pdfSafeText(textarea.value.replace(/<[^>]*>/g, " ").replace(/[ \t]+/g, " ").replace(/\n\s+/g, "\n").trim());
}

async function fetchPdfAsset(url, { cache = "force-cache" } = {}) {
  const response = await fetch(url, { cache });
  if (!response.ok) throw new Error(`PDF asset failed with status ${response.status}.`);
  return new Uint8Array(await response.arrayBuffer());
}

async function loadPdfLogo() {
  const image = new Image();
  image.decoding = "async";
  const loaded = new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("The catalog logo could not be loaded."));
  });
  image.src = new URL("/logo-pdf.png", window.location.origin).href;
  await loaded;

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The catalog logo could not be rendered.");
  context.drawImage(image, 0, 0);
  return { dataUrl: canvas.toDataURL("image/png"), aspectRatio: image.naturalHeight / image.naturalWidth };
}

async function fetchPdfProductImage(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`PDF product image failed with status ${response.status}.`);
  const payload = await response.json();
  if (payload?.format !== "PNG" || typeof payload.base64 !== "string" || !payload.base64) {
    throw new Error("PDF product image payload is invalid.");
  }
  return {
    dataUrl: `data:image/png;base64,${payload.base64}`,
    format: "PNG",
  };
}

function truncatePdfLines(pdf, text, width, maxLines = 2) {
  const lines = pdf.splitTextToSize(pdfSafeText(text), width);
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  const finalLine = visible[maxLines - 1];
  visible[maxLines - 1] = `${finalLine.slice(0, Math.max(1, finalLine.length - 3))}...`;
  return visible;
}

function drawCatalogLogo(pdf, logo, x, y, width = 45, fallbackColor = [255, 255, 255]) {
  if (logo) {
    pdf.addImage(logo.dataUrl, "PNG", x, y, width, width * logo.aspectRatio, "catalog-logo", "FAST");
  } else {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(width / 4);
    pdf.setTextColor(...fallbackColor);
    pdf.text("Maya Herbs", x, y + width * 0.22);
  }
}

function storePdfTheme() {
  return {
    primary: MAYA_PRIMARY,
    secondary: MAYA_SECONDARY,
    secondarySoft: [218, 235, 230],
    muted: [180, 211, 202],
    headerMuted: [190, 201, 198],
  };
}

function drawStoreBrand(
  pdf,
  logo,
  x,
  y,
  width = 45,
  fallbackColor = [255, 255, 255]
) {
  drawCatalogLogo(pdf, logo, x, y, width, fallbackColor);
}

async function fetchDigitalCatalogProducts({
  search = "",
  category = "",
  tribe = "",
  attributes = {},
} = {}) {
  const params = new URLSearchParams({ export: "true" });
  if (search) params.set("q", search);
  if (category) params.set("category", category);
  if (tribe) params.set("tribe", tribe);
  Object.entries(attributes).forEach(([key, value]) => {
    if (value) params.append("attribute", `${key}:${value}`);
  });

  const response = await fetch(`/api/catalog?${params.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data.error || "The digital catalog could not be prepared for export."
    );
  }
  const products = Array.isArray(data.products)
    ? data.products.filter(
        (product) =>
          !product.storeId || product.storeId === MAYA_STORE_ID
      )
    : [];
  if (products.length === 0) {
    throw new Error(
      "There are no digital catalog products matching the selected filters."
    );
  }
  return products;
}

async function buildDigitalCatalogPdf(options = {}) {
  const generatedAt = new Date();
  const currentProducts = await fetchDigitalCatalogProducts();
  const products = options.selectedIds?.length ? currentProducts.filter(product => options.selectedIds.includes(product.id)) : currentProducts;
  if (options.selectedIds?.length && products.length !== new Set(options.selectedIds).size) throw new Error("Some selected products are no longer available. Reload the catalog and review your selection.");
  if (!products.length) throw new Error("The selected products are no longer available. Reload the catalog and select again.");
  const pdf = await renderDigitalCatalogPdf({
    products,
    format: options.format || "detailed",
    includePrices: Boolean(options.includePrices),
    user: options.user || null,
    filterLabel: options.filterLabel || "Complete catalog",
    generatedAt,
  });
  return { pdf, products, generatedAt };
}

export async function createDigitalCatalogPdfPreview(options = {}) {
  const { pdf, products, generatedAt } = await buildDigitalCatalogPdf(options);
  return {
    blob: pdf.output("blob"),
    generatedAt,
    productCount: products.length,
  };
}

export async function downloadDigitalCatalogPdf(options = {}) {
  const delivery = preparePdfDelivery();

  try {
    const { pdf, generatedAt } = await buildDigitalCatalogPdf(options);
    const filename = `maya-herbs-catalog-${safeFilenameTimestamp(generatedAt)}.pdf`;
    await deliverPdf(pdf, filename, delivery);
  } catch (error) {
    showPdfDeliveryError(delivery);
    throw error;
  }
}

export async function renderDigitalCatalogPdf({ products, includePrices = true, user, filterLabel = "Complete catalog", generatedAt = new Date(), format = "detailed", loadImages = true }) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true, putOnlyUsedFonts: true });
  pdf.setProperties({ title: format === "compact" ? "Maya Herbs Wholesale Price List" : "Maya Herbs Wholesale Catalog", author: "Maya Herbs" });
  pdf.setCreationDate(generatedAt);
  let logo = null;
  if (loadImages) { try { logo = await loadPdfLogo(); } catch { /* Keep text branding if media cannot load. */ } }
  const stamp = formatPdfGenerationTimestamp(generatedAt);
  const groups = catalogGroups(products);
  const images = new Map();
  if (loadImages && format !== "compact") {
    const urls = [...new Set(products.map(product => product.image).filter(Boolean))];
    for (let start = 0; start < urls.length; start += 6) {
      await Promise.all(urls.slice(start, start + 6).map(async url => {
        try { images.set(url, await fetchPdfProductImage("/api/catalog/image?url=" + encodeURIComponent(url) + "&v=base64-json-v3")); }
        catch { images.set(url, null); }
      }));
    }
  }
  let y = 0;
  let heading = "";
  const newPage = () => {
    if (y) pdf.addPage();
    pdf.setFillColor(255,255,255); pdf.rect(0,0,210,297,"F");
    drawStoreBrand(pdf, logo, 12, 7, 36, MAYA_PRIMARY);
    pdf.setFont("helvetica","bold"); pdf.setFontSize(10); pdf.setTextColor(...MAYA_PRIMARY);
    pdf.text(format === "compact" ? "WHOLESALE PRICE LIST" : "WHOLESALE CATALOG", 198, 12, { align: "right" });
    pdf.setFont("helvetica","normal"); pdf.setFontSize(8); pdf.setTextColor(71,61,46);
    pdf.text(pdfSafeText(filterLabel), 198, 18, { align: "right" });
    pdf.setDrawColor(...MAYA_SECONDARY); pdf.line(12,27,198,27);
    y = 35;
    pdf.setFont("helvetica","bold"); pdf.setFontSize(11);
    const lines = pdf.splitTextToSize(pdfSafeText(heading), 182);
    pdf.text(lines, 12, y); y += lines.length * 5 + 5;
    if (format === "compact") {
      pdf.setFillColor(71,70,24); pdf.rect(12,y,186,9,"F"); pdf.setTextColor(255,255,255); pdf.setFontSize(8);
      pdf.text("SKU",14,y+6); pdf.text("Product",40,y+6); pdf.text("Available sizes",105,y+6); pdf.text("Price range (EUR)",159,y+6);
      y += 13;
    }
  };
  for (const group of groups) {
    heading = group.heading;
    if (format === "compact" && y && y < 227) {
      y += 8; pdf.setFont("helvetica", "bold"); pdf.setFontSize(11); pdf.setTextColor(71,61,46);
      const lines = pdf.splitTextToSize(pdfSafeText(heading),182); pdf.text(lines,12,y); y += lines.length*5+6;
    } else newPage();
    for (const product of group.products) {
      const prices = (product.options || []).map(option => optionPriceForUser(option,user,product.category)).filter(Number.isFinite);
      const min = prices.length ? Math.min(...prices) : null, max = prices.length ? Math.max(...prices) : null;
      const price = !includePrices ? "Login for pricing" : min == null ? "Contact sales" : "EUR " + min.toFixed(2) + (min !== max ? " - " + max.toFixed(2) : "");
      const sku = pdfSafeText(product.sku || product.options?.[0]?.sku || "-");
      const sizes = pdfSafeText(productFormats(product) || "Contact sales");
      if (format === "compact") {
        pdf.setFont("helvetica","normal"); pdf.setFontSize(8);
        const columns = [[sku,14,23],[pdfSafeText(product.name),40,61],[sizes,105,50],[price,159,37]].map(([text,x,width])=>({lines:pdf.splitTextToSize(text,width),x}));
        const height = Math.max(...columns.map(c=>c.lines.length))*4+7;
        if(y+height>267) newPage();
        pdf.setFont("helvetica","normal"); pdf.setFontSize(8); pdf.setTextColor(38,32,25);
        for(const column of columns) pdf.text(column.lines,column.x,y+3,{lineHeightFactor:1.4});
        y+=height; pdf.setDrawColor(220,220,205); pdf.line(12,y-3,198,y-3);
      } else {
        pdf.setFont("helvetica","bold"); pdf.setFontSize(14);
        const title = pdf.splitTextToSize(pdfSafeText(product.name),118);
        pdf.setFont("helvetica","normal"); pdf.setFontSize(9);
        const details = pdf.splitTextToSize("SKU: " + sku + "\nAvailable sizes: " + sizes + "\n" + price,118);
        const description = pdf.splitTextToSize(plainPdfText(product.description) || "Description not provided in the source catalog.",118);
        const headerHeight = title.length*6 + details.length*4.5 + 9;
        const minHeight = Math.max(63,headerHeight+Math.min(description.length,5)*4.5+8);
        if (y+minHeight>267) newPage();
        const image = images.get(product.image);
        if(image?.dataUrl) pdf.addImage(image.dataUrl,image.format,12,y,60,60,undefined,"FAST");
        else { pdf.setFillColor(245,245,239); pdf.rect(12,y,60,60,"F"); pdf.setFontSize(9); pdf.setTextColor(112,112,38); pdf.text("Maya Herbs",42,y+30,{align:"center"}); }
        pdf.setFont("helvetica","bold"); pdf.setFontSize(14); pdf.setTextColor(152,76,39); pdf.text(title,80,y+5,{lineHeightFactor:1.2});
        let textY = y + title.length*6 + 5;
        pdf.setFont("helvetica","normal"); pdf.setFontSize(9); pdf.setTextColor(71,61,46); pdf.text(details,80,textY,{lineHeightFactor:1.4});
        textY += details.length*4.5 + 4;
        let offset=0;
        while(offset<description.length) {
          const count=Math.max(1,Math.floor((266-textY)/4.5));
          pdf.text(description.slice(offset,offset+count),80,textY,{lineHeightFactor:1.4});
          const printed=Math.min(count,description.length-offset); offset+=printed; textY+=printed*4.5;
          if(offset<description.length) { newPage(); pdf.setFont("helvetica","normal"); pdf.setFontSize(9); pdf.setTextColor(71,61,46); textY=y; }
        }
        y=Math.max(y+63,textY+7); pdf.setDrawColor(220,220,205); pdf.line(12,y,198,y); y+=8;
      }
    }
  }
  const total=pdf.getNumberOfPages();
  for(let page=1;page<=total;page++) {
    pdf.setPage(page); pdf.setFont("helvetica","normal"); pdf.setFontSize(7); pdf.setTextColor(92,91,31);
    pdf.text("Prices in EUR. Final quantities, shipping and taxes are confirmed on your invoice.",12,278);
    pdf.text(stamp,12,289); pdf.text(page+" / "+total,198,289,{align:"right"});
  }
  return pdf;
}
