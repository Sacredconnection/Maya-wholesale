"use client";

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

const DEFAULT_ETHNICITY_COLOR = [38, 128, 114];
const MAYA_PRIMARY = [204, 102, 51];
const MAYA_SECONDARY = [153, 153, 51];
const MAYA_STORE_ID = "maya-herbs";
const ETHNICITY_COLORS = {
  apurina: [74, 115, 13],
  "apurina\u00a3": [74, 115, 13],
  caboclo: [64, 39, 30],
  "huni kuin": [166, 114, 68],
  katukina: [33, 64, 1],
  kuntanawa: [84, 87, 92],
  nukini: [224, 154, 30],
  puyanawa: [64, 44, 35],
  shanenawa: [3, 103, 166],
  shawadawa: [115, 20, 20],
  "shawa\u00a3dawa": [115, 20, 20],
  yawanawa: [191, 126, 4],
  shamanic: [104, 104, 73],
  "shamanic tobacco free": [29, 119, 115],
};

function normalizeEthnicity(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

function ethnicityColor(product) {
  return ETHNICITY_COLORS[normalizeEthnicity(product.tribe)] || DEFAULT_ETHNICITY_COLOR;
}

function mixWithWhite(color, amount) {
  return color.map((channel) => Math.round(channel + (255 - channel) * amount));
}

function relativeLuminance(color) {
  const channels = color.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function buttonTextColor(background) {
  const luminance = relativeLuminance(background);
  const whiteContrast = 1.05 / (luminance + 0.05);
  const darkContrast = (luminance + 0.05) / 0.06;
  return whiteContrast >= darkContrast ? [255, 255, 255] : [26, 26, 26];
}

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
      category: product.category || "",
      option: option.name || "Single format",
      weight: Number(option.weightGrams) || null,
      price: optionPriceForUser(option, user, product.category),
      importToken: catalogOrderItemToken(product, option),
      description: "",
      productUrl: product.productUrl || "",
    }));
  });
}

export async function exportCatalogExcel({ products, user, includeLinks }) {
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
    ["1", "Open the cart and locate products by SKU, name, category, or option."],
    ["2", "Enter the desired amount only in the Quantidade column. Keep SKU values unchanged."],
    ["3", "Use Descricao for an optional note about that line."],
    ["4", "Rows with quantity zero are ignored when the order file is imported."],
    ["5", "Save this workbook. CSV order import will be enabled in the next catalog phase."],
  ];
  instructions.getCell("B4").value = "HOW TO USE";
  instructions.getCell("B4").font = { bold: true, color: { argb: BRAND_GREEN } };
  guidance.forEach(([step, text], index) => {
    const row = 5 + index;
    instructions.getCell(row, 2).value = step;
    instructions.getCell(row, 2).font = { bold: true, color: { argb: BRAND_RED } };
    instructions.getCell(row, 3).value = text;
    instructions.getCell(row, 3).alignment = { wrapText: true, vertical: "top" };
    instructions.getRow(row).height = 27;
  });
  instructions.getCell("B12").value = "Generated";
  instructions.getCell("C12").value = new Date();
  instructions.getCell("C12").numFmt = "yyyy-mm-dd hh:mm";

  const sheet = workbook.addWorksheet("Order", {
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
  sheet.getCell("A1").value = "MAYA HERBS WHOLESALE ORDER";
  sheet.getCell("A1").font = { bold: true, size: 18, color: { argb: "FFFFFFFF" } };
  sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
  sheet.getCell("A1").alignment = { vertical: "middle" };
  sheet.getRow(1).height = 38;

  sheet.mergeCells("A2:J2");
  sheet.getCell("A2").value = "Fill only Quantidade and Descricao. Do not change SKU values.";
  sheet.getCell("A2").font = { italic: true, color: { argb: "FF4F625D" } };
  sheet.getCell("A2").alignment = { vertical: "middle" };
  sheet.getRow(2).height = 25;

  sheet.getCell("A3").value = "Products / variations";
  sheet.getCell("B3").value = catalogRows(products, user).length;
  sheet.getCell("D3").value = "Catalog products";
  sheet.getCell("E3").value = products.length;
  ["A3", "D3"].forEach((address) => {
    sheet.getCell(address).font = { bold: true, color: { argb: BRAND_GREEN } };
  });

  const headers = [
    "SKU",
    "Quantidade",
    "Descricao",
    "Produto",
    "Categoria",
    "Opcao",
    "Peso (g)",
    "Preco unitario (USD)",
    "Subtotal (USD)",
    "Produto no site",
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

  const rows = catalogRows(products, user);
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
    row.height = 24;
    row.alignment = { vertical: "middle" };
    row.getCell(1).numFmt = "@";
    row.getCell(2).numFmt = "0";
    row.getCell(2).dataValidation = {
      type: "whole",
      operator: "between",
      allowBlank: true,
      formulae: [0, 99999],
      showErrorMessage: true,
      errorTitle: "Invalid quantity",
      error: "Enter a whole number equal to or greater than zero.",
    };
    row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };
    row.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF9E8" } };
    row.getCell(8).numFmt = '"$"#,##0.00';
    row.getCell(9).numFmt = '"$"#,##0.00';
    if (includeLinks && item.productUrl) {
      row.getCell(10).value = {
        text: "Open product",
        hyperlink: new URL(item.productUrl, window.location.origin).href,
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
  sheet.getCell(totalRow, 9).numFmt = '"$"#,##0.00';
  sheet.autoFilter = { from: "A5", to: `J${lastDataRow}` };
  sheet.getColumn(11).hidden = true;

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
  return canvas.toDataURL("image/png");
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
    pdf.addImage(logo, "PNG", x, y, width, width * 0.36, "catalog-logo", "FAST");
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

function drawSharedCatalogBrand(pdf, logo, x, y, fallbackColor) {
  const logoWidth = 36;
  drawStoreBrand(pdf, logo, x, y, logoWidth, fallbackColor);
}

const contactIconSvg = (content) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;

const CONTACT_ICON_SVGS = {
  email: contactIconSvg(
    '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>'
  ),
  phone: contactIconSvg(
    '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>'
  ),
  location: contactIconSvg(
    '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>'
  ),
  website: contactIconSvg(
    '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10"/>'
  ),
};

function svgIconToPng(svg) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 192;
      canvas.height = 192;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas is unavailable for PDF contact icons."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("PDF contact icon could not be rendered."));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

async function loadContactIcons() {
  const entries = await Promise.all(
    Object.entries(CONTACT_ICON_SVGS).map(async ([type, svg]) => [type, await svgIconToPng(svg)])
  );
  return Object.fromEntries(entries);
}

function drawContactIcon(pdf, type, x, y, contactIcons) {
  const icon = contactIcons[type];
  if (icon) pdf.addImage(icon, "PNG", x, y, 7.5, 7.5, `catalog-contact-${type}`, "FAST");
}

function drawCoverContactInfo(pdf, contactIcons) {
  const rows = [
    {
      type: "email",
      values: ["info@mayaherbs.com"],
      centerX: 38.25,
      url: "mailto:info@mayaherbs.com",
    },
    {
      type: "phone",
      values: ["+31 23 532 5192"],
      centerX: 82.75,
      url: "tel:+31235325192",
    },
    {
      type: "location",
      values: ["Mollerusweg 66", "2031 BZ Haarlem", "The Netherlands"],
      centerX: 127.25,
      url: "https://www.google.com/maps/search/?api=1&query=Mollerusweg+66+2031+BZ+Haarlem",
    },
    {
      type: "website",
      values: ["https://wholesale.mayaherbs.com/"],
      centerX: 171.75,
      url: "https://wholesale.mayaherbs.com/",
    },
  ];

  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.4);
  pdf.line(16, 226, 194, 226);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text("CONTACT", 16, 236);

  rows.forEach((row) => {
    drawContactIcon(pdf, row.type, row.centerX - 3.75, 243.5, contactIcons);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.2);
    pdf.setTextColor(255, 255, 255);
    row.values.forEach((value, index) => {
      pdf.text(value, row.centerX, 257 + index * 4.5, { align: "center" });
    });
    pdf.link(row.centerX - 22.25, 242.5, 44.5, 26, { url: row.url });
  });
}

function drawGenerationStamp(
  pdf,
  generatedAtLabel,
  { darkBackground = false, y = 293 } = {}
) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.2);
  pdf.setTextColor(...(darkBackground ? [242, 242, 242] : [113, 128, 123]));
  pdf.text(`Generated: ${pdfSafeText(generatedAtLabel)}`, 198, y, {
    align: "right",
  });
}

function drawPdfCover(
  pdf,
  logo,
  contactIcons,
  filterLabel,
  generatedAtLabel
) {
  const normalizedFilterLabel = String(filterLabel || "").trim();
  const isCompleteCatalog =
    !normalizedFilterLabel ||
    normalizedFilterLabel.toLowerCase() === "complete catalog";
  const scopeEyebrow = isCompleteCatalog ? "" : "SELECTED PRODUCTS";
  const scopeTitle = isCompleteCatalog
    ? "COMPLETE CATALOG"
    : normalizedFilterLabel.replace(/\s*\|\s*/g, " / ");
  const filterDepth = isCompleteCatalog
    ? 0
    : normalizedFilterLabel.split("|").filter(Boolean).length;
  const scopeFontSize =
    filterDepth <= 1 ? 18 : filterDepth === 2 ? 13.5 : 10.5;
  pdf.setFillColor(...MAYA_PRIMARY);
  pdf.rect(0, 0, 210, 297, "F");
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 210, 36, "F");
  pdf.setDrawColor(...MAYA_SECONDARY);
  pdf.setLineWidth(0.7);
  pdf.line(0, 36, 210, 36);
  drawStoreBrand(pdf, logo, 16, 10, 44, MAYA_PRIMARY);

  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.55);
  pdf.line(16, 64, 58, 64);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text("WHOLESALE CATALOG", 16, 58);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(29);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Maya Herbs", 16, 84);
  pdf.text("Wholesale Catalog", 16, 98);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(242, 242, 242);
  pdf.text(
    truncatePdfLines(
      pdf,
      "A selection of Maya Herbs products for wholesale partners.",
      130,
      4
    ),
    16,
    116,
    { lineHeightFactor: 1.45 }
  );

  if (scopeEyebrow) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text(scopeEyebrow, 16, 140);
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(scopeFontSize);
  pdf.setTextColor(255, 255, 255);
  const scopeLines = truncatePdfLines(
    pdf,
    pdfSafeText(scopeTitle).toUpperCase(),
    178,
    3
  );
  const scopeLineHeight = scopeFontSize * 0.3528 * 1.08;
  const scopeCenterY = scopeEyebrow ? 156 : 145;
  const scopeStartY = scopeCenterY - ((scopeLines.length - 1) * scopeLineHeight) / 2;
  pdf.text(
    scopeLines,
    16,
    scopeStartY,
    { lineHeightFactor: 1.08 }
  );

  drawCoverContactInfo(pdf, contactIcons);

  drawGenerationStamp(pdf, generatedAtLabel, {
    darkBackground: true,
    y: 284,
  });
}

function drawStoreCover(
  pdf,
  logo,
  store,
  storeIndex,
  pageNumber,
  pageCount,
  generatedAtLabel
) {
  const theme = storePdfTheme(store.storeId);
  const storeHeadingColor = [255, 255, 255];
  pdf.setFillColor(...theme.primary);
  pdf.rect(0, 0, 210, 297, "F");
  drawStoreBrand(pdf, logo, 16, 14, 50);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...storeHeadingColor);
  pdf.text(`STORE ${String(storeIndex + 1).padStart(2, "0")}`, 16, 76);
  pdf.setDrawColor(...storeHeadingColor);
  pdf.setLineWidth(0.7);
  pdf.line(16, 82, 54, 82);
  pdf.setFontSize(29);
  pdf.setTextColor(255, 255, 255);
  pdf.text(truncatePdfLines(pdf, store.storeName, 168, 3), 16, 108, {
    lineHeightFactor: 1.08,
  });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(242, 242, 242);
  const storeDescription =
    "Maya Herbs products presented by collection, including indigenous traditions, formats, identifiers, and product descriptions.";
  pdf.text(truncatePdfLines(pdf, storeDescription, 145, 5), 16, 139, {
    lineHeightFactor: 1.45,
  });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text("STORE SECTION", 16, 264);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(242, 242, 242);
  pdf.text(`Page ${pageNumber} of ${pageCount}`, 16, 276);
  drawGenerationStamp(pdf, generatedAtLabel, { darkBackground: true });
}

function drawGridHeader(
  pdf,
  logo,
  storeId,
  storeName,
  category,
  pageNumber,
  pageCount
) {
  const theme = storePdfTheme(storeId);
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 210, 28, "F");
  pdf.setDrawColor(...MAYA_SECONDARY);
  pdf.setLineWidth(0.6);
  pdf.line(0, 28, 210, 28);
  drawStoreBrand(pdf, logo, 12, 6.5, 36, MAYA_PRIMARY);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...theme.secondary);
  pdf.text(
    truncatePdfLines(
      pdf,
      `${pdfSafeText(storeName)} / ${pdfSafeText(category)}`.toUpperCase(),
      105,
      1
    ),
    198,
    12,
    { align: "right" }
  );
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.setTextColor(92, 91, 31);
  pdf.text(`MAYA HERBS WHOLESALE  |  ${pageNumber}/${pageCount}`, 198, 19, { align: "right" });
}

function drawCategoryCover(
  pdf,
  logo,
  storeId,
  storeName,
  category,
  categoryIndex,
  pageNumber,
  pageCount,
  generatedAtLabel
) {
  const theme = storePdfTheme(storeId);
  const collectionHeadingColor = [255, 255, 255];
  pdf.setFillColor(...theme.primary);
  pdf.rect(0, 0, 210, 297, "F");
  drawStoreBrand(pdf, logo, 16, 14, 50);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...collectionHeadingColor);
  pdf.text(
    `${pdfSafeText(storeName).toUpperCase()} / COLLECTION ${String(categoryIndex + 1).padStart(2, "0")}`,
    16,
    76
  );
  pdf.setDrawColor(...collectionHeadingColor);
  pdf.setLineWidth(0.7);
  pdf.line(16, 82, 54, 82);
  pdf.setFontSize(29);
  pdf.setTextColor(255, 255, 255);
  pdf.text(truncatePdfLines(pdf, category, 168, 3), 16, 108, { lineHeightFactor: 1.08 });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(242, 242, 242);
  const collectionDescription = category === "Rapé Indigenous"
    ? "Traditional rapé blends organized by their source tribe and the product information available in the wholesale catalog."
    : `${pdfSafeText(storeName)} products presented with their wholesale formats, product identifiers, and catalog descriptions.`;
  pdf.text(truncatePdfLines(pdf, collectionDescription, 145, 4), 16, 139, { lineHeightFactor: 1.45 });

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text("CLICK ANY PRODUCT TO CONTINUE ONLINE", 16, 264);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(242, 242, 242);
  pdf.text(`Page ${pageNumber} of ${pageCount}`, 16, 276);
  drawGenerationStamp(pdf, generatedAtLabel, { darkBackground: true });
}

const GRID_PRODUCT_CARD_HEIGHT = 117;
const GRID_PRODUCT_CARD_GAP = 6;

function fitPdfText(pdf, text, width, maxHeight, {
  maxFontSize,
  minFontSize,
  lineHeightFactor = 1.1,
  step = 0.5,
}) {
  const safeText = pdfSafeText(text);
  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= step) {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(safeText, width);
    const lineHeight = (fontSize * lineHeightFactor) / pdf.internal.scaleFactor;
    if (lines.length * lineHeight <= maxHeight) {
      return { lines, fontSize, lineHeight, lineHeightFactor };
    }
  }

  pdf.setFontSize(minFontSize);
  const lines = pdf.splitTextToSize(safeText, width);
  return {
    lines,
    fontSize: minFontSize,
    lineHeight: (minFontSize * lineHeightFactor) / pdf.internal.scaleFactor,
    lineHeightFactor,
  };
}

function gridProductCardLayout(pdf, product, includePrices, user) {
  const description = plainPdfText(product.description) || "Description not provided in the source catalog.";
  const contentWidth = 95;
  const price = includePrices && product.options?.[0]
    ? optionPriceForUser(product.options[0], user, product.category)
    : null;

  pdf.setFont("helvetica", "bold");
  const title = fitPdfText(pdf, product.name, contentWidth, 18, {
    maxFontSize: 20,
    minFontSize: 10,
    lineHeightFactor: 1.04,
  });

  pdf.setFont("helvetica", "normal");
  const descriptionLayout = fitPdfText(
    pdf,
    description,
    contentWidth,
    Number.isFinite(price) ? 39 : 49,
    {
      maxFontSize: 11.5,
      minFontSize: 7,
      lineHeightFactor: 1.12,
    }
  );

  return {
    contentWidth,
    description: descriptionLayout,
    height: GRID_PRODUCT_CARD_HEIGHT,
    price,
    title,
  };
}

function drawGridProductCard(
  pdf,
  product,
  image,
  x,
  y,
  layout
) {
  const width = 186;
  const height = layout.height;
  const accent = ethnicityColor(product);
  const accentBorder = mixWithWhite(accent, 0.72);
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...accentBorder);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(x, y, width, height, 1.8, 1.8, "FD");

  pdf.setFillColor(239, 244, 242);
  pdf.roundedRect(x + 8, y + 23, 70, 70, 1.2, 1.2, "F");
  if (image?.dataUrl && image?.format) {
    pdf.addImage(
      image.dataUrl,
      image.format,
      x + 8,
      y + 23,
      70,
      70,
      `catalog-product-${pdfSafeText(product.id || product.sku || product.name)}`,
      "FAST"
    );
  } else {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(34);
    pdf.setTextColor(...accent);
    pdf.text(String(product.name || "?").charAt(0).toUpperCase(), x + 43, y + 64, { align: "center" });
  }

  const identityX = x + 84;
  const contentWidth = layout.contentWidth;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(33, 33, 33);
  pdf.text(pdfSafeText(product.tribe || product.category || "COLLECTION").toUpperCase(), identityX, y + 14);
  pdf.setFontSize(layout.title.fontSize);
  pdf.setTextColor(...MAYA_SECONDARY);
  pdf.text(layout.title.lines, identityX, y + 22, {
    lineHeightFactor: layout.title.lineHeightFactor,
  });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10.5);
  pdf.setTextColor(33, 33, 33);
  const sku = pdfSafeText(product.sku || "-");
  pdf.text(sku, identityX, y + 45);

  pdf.setDrawColor(220, 229, 226);
  pdf.line(identityX, y + 52, x + width - 7, y + 52);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(layout.description.fontSize);
  pdf.setTextColor(65, 80, 75);
  const descriptionY = y + 61;
  pdf.text(layout.description.lines, identityX, descriptionY, {
    lineHeightFactor: layout.description.lineHeightFactor,
  });

  if (Number.isFinite(layout.price)) {
    const descriptionHeight = layout.description.lines.length * layout.description.lineHeight;
    const priceLabel = `$${layout.price.toFixed(2)}`;
    const priceY = descriptionY + descriptionHeight + 7;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(17);
    pdf.setTextColor(...MAYA_SECONDARY);
    pdf.text(priceLabel, identityX, priceY);
  }
}

function drawIndexNavigationButton(
  pdf,
  x,
  label,
  theme,
  destination,
  width = 50
) {
  const y = 270;
  const height = 8;
  pdf.setFillColor(...theme.primary);
  pdf.roundedRect(x, y, width, height, 1, 1, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.2);
  pdf.setTextColor(...buttonTextColor(theme.primary));
  pdf.text(label, x + width / 2, y + 5.3, { align: "center" });
  if (destination) {
    pdf.link(x, y, width, height, {
      pageNumber: destination.pageNumber,
      top: 0,
      zoom: 1,
    });
  }
}

function drawGridFooter(
  pdf,
  storeName,
  category,
  pageNumber,
  pageCount,
  generatedAtLabel
) {
  pdf.setDrawColor(220, 229, 226);
  pdf.line(12, 282, 198, 282);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(113, 128, 123);
  pdf.text(`${pdfSafeText(storeName)} Wholesale`, 12, 288);
  pdf.text(
    `${pdfSafeText(storeName)} / ${pdfSafeText(category)}  |  ${pageNumber}/${pageCount}`,
    198,
    288,
    { align: "right" }
  );
  drawGenerationStamp(pdf, generatedAtLabel);
}

function drawGridPage(pdf, {
  products,
  images,
  logo,
  includePrices,
  user,
  storeId,
  storeName,
  category,
  pageNumber,
  pageCount,
  generatedAtLabel,
}) {
  drawGridHeader(
    pdf,
    logo,
    storeId,
    storeName,
    category,
    pageNumber,
    pageCount
  );
  products.forEach((product, index) => {
    const layout = gridProductCardLayout(pdf, product, includePrices, user);
    drawGridProductCard(
      pdf,
      product,
      images[index],
      12,
      35 + index * (GRID_PRODUCT_CARD_HEIGHT + GRID_PRODUCT_CARD_GAP),
      layout
    );
  });
  drawGridFooter(
    pdf,
    storeName,
    category,
    pageNumber,
    pageCount,
    generatedAtLabel
  );
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
  const products = await fetchDigitalCatalogProducts(options);
  const pdf = await renderDigitalCatalogPdf({
    products,
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

async function renderDigitalCatalogPdf({
  products,
  includePrices,
  user,
  filterLabel,
  generatedAt,
}) {
  const { jsPDF } = await import("jspdf");
  const preferredStoreOrder = [MAYA_STORE_ID];
  const preferredCategoriesByStore = {
    [MAYA_STORE_ID]: ["Rapé Indigenous", "Maya Herbs"],
  };
  const categorySort = (storeId) => (a, b) => {
    const preferredCategories =
      preferredCategoriesByStore[storeId]?.map(normalizeEthnicity) || [];
    const aIndex = preferredCategories.indexOf(normalizeEthnicity(a));
    const bIndex = preferredCategories.indexOf(normalizeEthnicity(b));
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  };
  const storeIds = [
    ...new Set(products.map((product) => product.storeId || MAYA_STORE_ID)),
  ].sort((a, b) => {
    const aIndex = preferredStoreOrder.indexOf(a);
    const bIndex = preferredStoreOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  const storeGroups = storeIds.map((storeId) => {
    const storeProducts = products.filter(
      (product) => (product.storeId || MAYA_STORE_ID) === storeId
    );
    const storeName =
      storeProducts.find((product) => product.storeName)?.storeName ||
      "Maya Herbs";
    const categories = [
      ...new Set(
        storeProducts.map((product) => product.category || "Other")
      ),
    ].sort(categorySort(storeId));
    return {
      storeId,
      storeName,
      products: storeProducts,
      categoryGroups: categories.map((category) => ({
        storeId,
        storeName,
        category,
        products: storeProducts.filter(
          (product) => (product.category || "Other") === category
        ),
      })),
    };
  });
  const categoryGroups = storeGroups.flatMap((store) => store.categoryGroups);
  const pdf = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
    compress: true,
    putOnlyUsedFonts: true,
  });
  pdf.setDisplayMode("100%", "continuous", "UseNone");
  pdf.setProperties({
    title: "Maya Herbs Wholesale Catalog",
    subject: "Maya Herbs wholesale catalog",
    author: "Maya Herbs",
    creator: "Wholesale Digital Catalog",
  });

  const productPageCount = categoryGroups.reduce(
    (total, group) => total + Math.ceil(group.products.length / 2),
    0
  );
  const pageCount = 1 + productPageCount;

  let logo = null;
  try {
    logo = await loadPdfLogo();
  } catch {
    // A text fallback is drawn when the local brand asset cannot be loaded.
  }

  let contactIcons = {};
  try {
    contactIcons = await loadContactIcons();
  } catch {
    // Contact text and links remain available if an icon cannot be rendered.
  }

  const imageCache = new Map();
  const loadProductImage = (product) => {
    if (!product.image) return Promise.resolve(null);
    if (!imageCache.has(product.image)) {
      const proxyUrl = `/api/catalog/image?url=${encodeURIComponent(product.image)}&v=base64-json-v3`;
      imageCache.set(
        product.image,
        fetchPdfProductImage(proxyUrl).catch(() => null)
      );
    }
    return imageCache.get(product.image);
  };

  const productImages = [];
  const imageBatchSize = 12;
  for (let batchStart = 0; batchStart < products.length; batchStart += imageBatchSize) {
    const batch = products.slice(batchStart, batchStart + imageBatchSize);
    productImages.push(...(await Promise.all(batch.map(loadProductImage))));
  }
  const imagesByProduct = new Map(products.map((product, index) => [product.id || product.sku, productImages[index]]));
  const generatedAtLabel = formatPdfGenerationTimestamp(generatedAt);
  pdf.setCreationDate(generatedAt);
  drawPdfCover(
    pdf,
    logo,
    contactIcons,
    filterLabel,
    generatedAtLabel
  );
  let currentPage = 1;
  storeGroups.forEach((store) => {
    store.categoryGroups.forEach((group) => {
      for (let start = 0; start < group.products.length; start += 2) {
        const pageProducts = group.products.slice(start, start + 2);
        pdf.addPage("a4", "portrait");
        currentPage += 1;
        drawGridPage(pdf, {
          products: pageProducts,
          images: pageProducts.map(
            (product) =>
              imagesByProduct.get(product.id || product.sku) || null
          ),
          logo,
          includePrices,
          user,
          storeId: store.storeId,
          storeName: store.storeName,
          category: group.category,
          pageNumber: currentPage,
          pageCount,
          generatedAtLabel,
        });
      }
    });
  });

  return pdf;
}
