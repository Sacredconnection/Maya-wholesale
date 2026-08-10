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

function drawCatalogLogo(pdf, logo, x, y, width = 45) {
  if (logo) {
    pdf.addImage(logo, "PNG", x, y, width, width * 0.36, "catalog-logo", "FAST");
  } else {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(width / 4);
    pdf.setTextColor(255, 255, 255);
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

function drawStoreBrand(pdf, logo, x, y, width = 45) {
  drawCatalogLogo(pdf, logo, x, y, width);
}

function drawSharedCatalogBrand(pdf, logo, x, y) {
  const logoWidth = 36;
  drawStoreBrand(pdf, logo, x, y, logoWidth);
}

function drawGreenCoverBackground(pdf, background) {
  if (!background) return;
  pdf.addImage(background, "PNG", 0, 0, 210, 297, "catalog-cover-background", "FAST");
}

function drawCoverDecoration(pdf, decoration) {
  if (!decoration) return;
  pdf.addImage(decoration, "PNG", 105, 0, 105, 42, "catalog-cover-decoration", "FAST");
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
  const iconX = 116;
  const textX = 128;

  const rows = [
    {
      type: "email",
      values: ["info@mayaherbs.com"],
      y: 238,
      url: "mailto:info@mayaherbs.com",
      linkHeight: 10,
    },
    {
      type: "phone",
      values: ["+31 23 532 5192"],
      y: 251.5,
      url: "tel:+31235325192",
      linkHeight: 10,
    },
    {
      type: "location",
      values: ["Mollerusweg 66", "2031 BZ Haarlem", "The Netherlands"],
      y: 265,
      url: "https://www.google.com/maps/search/?api=1&query=Mollerusweg+66+2031+BZ+Haarlem",
      linkHeight: 19,
    },
  ];

  rows.forEach((row) => {
    drawContactIcon(pdf, row.type, iconX, row.y, contactIcons);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.7);
    pdf.setTextColor(255, 255, 255);
    row.values.forEach((value, index) => {
      pdf.text(value, textX, row.y + 5.2 + index * 4.5);
    });
    pdf.link(iconX - 1, row.y - 1, 79, row.linkHeight, { url: row.url });
  });
}

function drawGenerationStamp(pdf, generatedAtLabel, { darkBackground = false } = {}) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.2);
  pdf.setTextColor(...(darkBackground ? [180, 211, 202] : [113, 128, 123]));
  pdf.text(`Generated: ${pdfSafeText(generatedAtLabel)}`, 198, 293, {
    align: "right",
  });
}

function drawPdfCover(
  pdf,
  logo,
  coverBackground,
  coverDecoration,
  contactIcons,
  products,
  filterLabel,
  generatedAtLabel
) {
  const categoryCount = new Set(products.map((product) => product.category).filter(Boolean)).size;
  const traditionCount = new Set(products.map((product) => product.tribe).filter(Boolean)).size;
  const normalizedFilterLabel = String(filterLabel || "").trim();
  const isCompleteCatalog =
    !normalizedFilterLabel ||
    normalizedFilterLabel.toLowerCase() === "complete catalog";
  const scopeEyebrow = isCompleteCatalog ? "MAYA HERBS" : "SELECTED PRODUCTS";
  const scopeTitle = isCompleteCatalog
    ? "COMPLETE CATALOG"
    : normalizedFilterLabel.replace(/\s*\|\s*/g, " / ");
  const filterDepth = isCompleteCatalog
    ? 0
    : normalizedFilterLabel.split("|").filter(Boolean).length;
  const scopeFontSize =
    filterDepth <= 1 ? 18 : filterDepth === 2 ? 13.5 : 10.5;
  pdf.setFillColor(20, 65, 57);
  pdf.rect(0, 0, 210, 297, "F");
  drawGreenCoverBackground(pdf, coverBackground);
  pdf.setFillColor(26, 26, 26);
  pdf.rect(0, 0, 210, 42, "F");
  drawCoverDecoration(pdf, coverDecoration);
  drawSharedCatalogBrand(pdf, logo, 16, 13);

  pdf.setDrawColor(130, 214, 197);
  pdf.setLineWidth(0.6);
  pdf.line(16, 74, 54, 74);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(130, 214, 197);
  pdf.text("WHOLESALE CATALOG", 16, 68);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(31);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Maya Herbs", 16, 101);
  pdf.text("Wholesale Catalog", 16, 116);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);
  pdf.setTextColor(218, 235, 230);
  pdf.text(
    truncatePdfLines(
      pdf,
      "A selection of Maya Herbs products for wholesale partners.",
      130,
      4
    ),
    16,
    134,
    { lineHeightFactor: 1.45 }
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(130, 214, 197);
  pdf.text(scopeEyebrow, 16, 153);
  pdf.setFontSize(scopeFontSize);
  pdf.setTextColor(255, 255, 255);
  const scopeLines = truncatePdfLines(
    pdf,
    pdfSafeText(scopeTitle).toUpperCase(),
    178,
    3
  );
  const scopeLineHeight = scopeFontSize * 0.3528 * 1.08;
  const scopeStartY = 169 - ((scopeLines.length - 1) * scopeLineHeight) / 2;
  pdf.text(
    scopeLines,
    16,
    scopeStartY,
    { lineHeightFactor: 1.08 }
  );

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(16, 180, 178, 48, 2.5, 2.5, "F");
  const stats = [
    [String(traditionCount), "ORIGINS"],
    [String(products.length), "PRODUCTS"],
    [String(categoryCount), "COLLECTIONS"],
  ];
  stats.forEach(([value, label], index) => {
    const x = 45 + index * 59;
    if (index) {
      pdf.setDrawColor(220, 229, 226);
      pdf.line(x - 29, 191, x - 29, 217);
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.setTextColor(38, 128, 114);
    pdf.text(value, x, 201, { align: "center" });
    pdf.setFontSize(7);
    pdf.setTextColor(83, 105, 98);
    pdf.text(label, x, 213, { align: "center" });
  });

  drawCoverContactInfo(pdf, contactIcons);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text("MAYA HERBS", 16, 278);
  drawGenerationStamp(pdf, generatedAtLabel, { darkBackground: true });
}

function drawStoreCover(
  pdf,
  logo,
  coverBackground,
  coverDecoration,
  store,
  storeIndex,
  pageNumber,
  pageCount,
  generatedAtLabel
) {
  const theme = storePdfTheme(store.storeId);
  const storeHeadingColor = theme.secondary;
  pdf.setFillColor(...theme.primary);
  pdf.rect(0, 0, 210, 297, "F");
  drawGreenCoverBackground(pdf, coverBackground);
  drawCoverDecoration(pdf, coverDecoration);
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
  pdf.setTextColor(...theme.secondarySoft);
  const storeDescription =
    "Maya Herbs products presented by collection, including indigenous traditions, formats, identifiers, and product descriptions.";
  pdf.text(truncatePdfLines(pdf, storeDescription, 145, 5), 16, 139, {
    lineHeightFactor: 1.45,
  });

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(16, 180, 178, 48, 2.5, 2.5, "F");
  const storeStats = [
    [String(store.products.length), "PRODUCTS"],
    [String(store.categoryGroups.length), "CATEGORIES"],
  ];
  storeStats.forEach(([value, label], index) => {
    const x = index === 0 ? 62 : 148;
    if (index) {
      pdf.setDrawColor(220, 229, 226);
      pdf.line(105, 190, 105, 218);
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(21);
    pdf.setTextColor(...theme.primary);
    pdf.text(value, x, 201, { align: "center" });
    pdf.setFontSize(7);
    pdf.setTextColor(83, 105, 98);
    pdf.text(label, x, 213, { align: "center" });
  });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text("STORE SECTION", 16, 264);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...theme.muted);
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
  pdf.setFillColor(26, 26, 26);
  pdf.rect(0, 0, 210, 28, "F");
  drawStoreBrand(pdf, logo, 12, 6.5, 36);

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
  pdf.setTextColor(...theme.headerMuted);
  pdf.text(`MAYA HERBS WHOLESALE  |  ${pageNumber}/${pageCount}`, 198, 19, { align: "right" });
}

function drawCategoryCover(
  pdf,
  logo,
  coverBackground,
  coverDecoration,
  storeId,
  storeName,
  category,
  products,
  categoryIndex,
  pageNumber,
  pageCount,
  generatedAtLabel
) {
  const tribes = [...new Set(products.map((product) => product.tribe).filter(Boolean))];
  const theme = storePdfTheme(storeId);
  const collectionHeadingColor = theme.secondary;
  pdf.setFillColor(...theme.primary);
  pdf.rect(0, 0, 210, 297, "F");
  drawGreenCoverBackground(pdf, coverBackground);
  drawCoverDecoration(pdf, coverDecoration);
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
  pdf.setTextColor(...theme.secondarySoft);
  const collectionDescription = category === "Rapé Indigenous"
    ? "Traditional rapé blends organized by their source tribe and the product information available in the wholesale catalog."
    : `${pdfSafeText(storeName)} products presented with their wholesale formats, product identifiers, and catalog descriptions.`;
  pdf.text(truncatePdfLines(pdf, collectionDescription, 145, 4), 16, 139, { lineHeightFactor: 1.45 });

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(16, 180, 178, 48, 2.5, 2.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(21);
  pdf.setTextColor(...theme.primary);
  pdf.text(String(products.length), 42, 201, { align: "center" });
  pdf.setFontSize(7);
  pdf.setTextColor(83, 105, 98);
  pdf.text("PRODUCTS", 42, 213, { align: "center" });
  pdf.setDrawColor(220, 229, 226);
  pdf.line(68, 190, 68, 218);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(83, 105, 98);
  pdf.text(
    truncatePdfLines(
      pdf,
      tribes.length ? `Subcategories: ${tribes.join(", ")}` : `${storeName} collection`,
      113,
      4
    ),
    78,
    195,
    { lineHeightFactor: 1.35 }
  );
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text("CLICK ANY PRODUCT TO CONTINUE ONLINE", 16, 264);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...theme.muted);
  pdf.text(`Page ${pageNumber} of ${pageCount}`, 16, 276);
  drawGenerationStamp(pdf, generatedAtLabel, { darkBackground: true });
}

function gridProductCardLayout(pdf, product) {
  const description = plainPdfText(product.description) || "Description not provided in the source catalog.";
  const variations = product.productType === "variable" && Array.isArray(product.options)
    ? product.options
    : [];
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12.5);
  const descriptionLines = pdf.splitTextToSize(description, 88);
  const variationRows = Math.ceil(variations.length / 2);
  return {
    descriptionLines,
    variations,
    height: Math.max(117, 66 + descriptionLines.length * 5 + (variationRows ? 8 + variationRows * 11 : 0)),
  };
}

function drawGridProductCard(
  pdf,
  product,
  image,
  includePrices,
  user,
  x,
  y,
  layout
) {
  const width = 186;
  const height = layout.height;
  const accent = ethnicityColor(product);
  const accentSoft = mixWithWhite(accent, 0.92);
  const accentBorder = mixWithWhite(accent, 0.72);
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...accentBorder);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(x, y, width, height, 1.8, 1.8, "FD");

  pdf.setFillColor(239, 244, 242);
  pdf.roundedRect(x + 8, y + 20, 76, 76, 1.2, 1.2, "F");
  if (image?.dataUrl && image?.format) {
    pdf.addImage(
      image.dataUrl,
      image.format,
      x + 8,
      y + 20,
      76,
      76,
      `catalog-product-${pdfSafeText(product.id || product.sku || product.name)}`,
      "FAST"
    );
  } else {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(34);
    pdf.setTextColor(...accent);
    pdf.text(String(product.name || "?").charAt(0).toUpperCase(), x + 46, y + 65, { align: "center" });
  }

  const identityX = x + 94;
  const contentWidth = 88;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...accent);
  pdf.text(pdfSafeText(product.tribe || product.category || "COLLECTION").toUpperCase(), identityX, y + 14);
  pdf.setFontSize(22);
  pdf.setTextColor(...DEFAULT_ETHNICITY_COLOR);
  pdf.text(truncatePdfLines(pdf, product.name, contentWidth, 2), identityX, y + 24, { lineHeightFactor: 1.06 });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10.5);
  pdf.setTextColor(113, 128, 123);
  const price = includePrices && product.options?.[0]
    ? optionPriceForUser(product.options[0], user, product.category)
    : null;
  const sku = pdfSafeText(product.sku || "-");
  pdf.text(sku, identityX, y + 43);
  if (Number.isFinite(price)) {
    pdf.setFontSize(17);
    pdf.setTextColor(...DEFAULT_ETHNICITY_COLOR);
    pdf.text(`$${price.toFixed(2)}`, identityX + pdf.getTextWidth(sku) + 6, y + 43);
  }

  pdf.setDrawColor(220, 229, 226);
  pdf.line(identityX, y + 50, x + width - 7, y + 50);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12.5);
  pdf.setTextColor(65, 80, 75);
  pdf.text(layout.descriptionLines, identityX, y + 61, { lineHeightFactor: 1.15 });

  const { variations } = layout;
  if (variations.length) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...accent);
    const variationsY = y + 61 + layout.descriptionLines.length * 5 + 6;
    pdf.text("AVAILABLE VARIATIONS", identityX, variationsY);

    const tableX = identityX;
    const tableY = variationsY + 3;
    const columnCount = 2;
    const columnGap = 2;
    const rowGap = 2;
    const cellWidth = (contentWidth - columnGap * (columnCount - 1)) / columnCount;
    const cellHeight = 9;
    variations.forEach((option, index) => {
      const column = index % columnCount;
      const row = Math.floor(index / columnCount);
      const cellX = tableX + column * (cellWidth + columnGap);
      const cellY = tableY + row * (cellHeight + rowGap);
      const price = optionPriceForUser(option, user, product.category);
      pdf.setFillColor(...accentSoft);
      pdf.setDrawColor(...accentBorder);
      pdf.setLineWidth(0.2);
      pdf.roundedRect(cellX, cellY, cellWidth, cellHeight, 0.7, 0.7, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(includePrices ? 5.7 : 6.3);
      pdf.setTextColor(...accent);
      pdf.text(
        truncatePdfLines(pdf, pdfSafeText(option.name || "Variation"), cellWidth - 3, 1),
        cellX + cellWidth / 2,
        includePrices ? cellY + 3.7 : cellY + 5.6,
        { align: "center" }
      );
      if (includePrices && Number.isFinite(price)) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(5.7);
        pdf.setTextColor(65, 80, 75);
        pdf.text(`$${price.toFixed(2)}`, cellX + cellWidth / 2, cellY + 7, {
          align: "center",
        });
      }
    });
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
    const layout = gridProductCardLayout(pdf, product);
    drawGridProductCard(
      pdf,
      product,
      images[index],
      includePrices,
      user,
      12,
      35 + products.slice(0, index).reduce((offset, item) => offset + gridProductCardLayout(pdf, item).height + 6, 0),
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

function buildIndexRows(store) {
  const rows = [];
  store.categoryGroups.forEach((group, categoryIndex) => {
    const gapBefore = categoryIndex === 0 ? 0 : 5;
    rows.push({
      type: "category",
      storeId: store.storeId,
      label: group.category,
      gapBefore,
      height: 10 + gapBefore,
    });
    const ethnicityNames = [
      ...new Set(
        group.products.map((product) => product.tribe || group.category)
      ),
    ].sort((a, b) => a.localeCompare(b));
    ethnicityNames.forEach((ethnicity) => {
      if (normalizeEthnicity(ethnicity) !== normalizeEthnicity(group.category)) {
        rows.push({
          type: "ethnicity",
          storeId: store.storeId,
          label: ethnicity,
          gapBefore: 3,
          height: 12,
        });
      }
      group.products
        .filter((product) => (product.tribe || group.category) === ethnicity)
        .sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""))
        )
        .forEach((product) =>
          rows.push({
            type: "product",
            storeId: store.storeId,
            product,
            height: 8.5,
          })
        );
    });
  });
  return rows;
}

function paginateIndexRows(rows) {
  const columnHeight = 236;
  const pages = [];
  let page = [[], []];
  let column = 0;
  let usedHeight = 0;
  let currentCategory = "";
  let currentEthnicity = "";

  const advanceColumn = () => {
    if (column === 0) {
      column = 1;
    } else {
      pages.push(page);
      page = [[], []];
      column = 0;
    }
    usedHeight = 0;
  };

  const addRow = (row) => {
    page[column].push(row);
    usedHeight += row.height;
  };

  const continuationRows = (row) => {
    const repeated = [];
    if (
      row.type === "product" &&
      currentEthnicity &&
      normalizeEthnicity(currentEthnicity) !== normalizeEthnicity(currentCategory)
    ) {
      repeated.push({
        type: "ethnicity",
        storeId: row.storeId,
        label: currentEthnicity,
        height: 9,
        continuation: true,
      });
    }
    return repeated;
  };

  rows.forEach((row, index) => {
    if (row.type === "category") {
      currentCategory = row.label;
      currentEthnicity = "";
    } else if (row.type === "ethnicity") {
      currentEthnicity = row.label;
    } else if (row.type === "product") {
      currentEthnicity = row.product.tribe || currentCategory;
    }

    const nextHeight = rows[index + 1]?.height || 0;
    const keepWithNext = row.type !== "product" ? nextHeight : 0;
    if (usedHeight + row.height + keepWithNext > columnHeight) {
      advanceColumn();
      continuationRows(row).forEach(addRow);
    }
    addRow(row);
  });
  if (page[0].length || page[1].length) pages.push(page);
  return pages;
}

function drawIndexPage(pdf, {
  columns,
  ethnicityLinks,
  logo,
  productDestinations,
  storeId,
  storeName,
  pageNumber,
  pageCount,
  indexPage,
  indexPageCount,
  generatedAtLabel,
}) {
  const theme = storePdfTheme(storeId);
  const medicineGreen = ethnicityColor({ tribe: "Medicina Sagrada" });
  pdf.setFillColor(26, 26, 26);
  pdf.rect(0, 0, 210, 28, "F");
  drawStoreBrand(pdf, logo, 12, 6.5, 36);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...theme.secondary);
  pdf.text(`${pdfSafeText(storeName).toUpperCase()} INDEX`, 198, 12, {
    align: "right",
  });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.setTextColor(...theme.headerMuted);
  pdf.text(`PRODUCT DIRECTORY  |  ${indexPage}/${indexPageCount}`, 198, 19, { align: "right" });
  const indexRowsTop = 38;
  pdf.setDrawColor(220, 229, 226);
  pdf.setLineWidth(0.25);
  pdf.line(103, indexRowsTop, 103, 274);

  columns.forEach((rows, columnIndex) => {
    const x = columnIndex === 0 ? 12 : 108;
    const width = 90;
    let y = indexRowsTop;
    rows.forEach((row) => {
      if (row.type === "category") {
        const categoryY = y + (row.gapBefore || 0);
        const useMedicineGreen =
          storeId === "maya-herbs" &&
          normalizeEthnicity(row.label) ===
            normalizeEthnicity("Maya Herbs");
        if (row.gapBefore) {
          pdf.setDrawColor(211, 224, 220);
          pdf.setLineWidth(0.2);
          pdf.line(x, y + 2, x + width, y + 2);
        }
        pdf.setFillColor(
          ...(useMedicineGreen
            ? mixWithWhite(medicineGreen, 0.86)
            : theme.primary)
        );
        pdf.roundedRect(x, categoryY, width, 9, 1, 1, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(
          ...(useMedicineGreen ? medicineGreen : [255, 255, 255])
        );
        pdf.text(
          truncatePdfLines(
            pdf,
            pdfSafeText(row.label).toUpperCase(),
            width - 6,
            1
          ),
          x + 3,
          categoryY + 6
        );
      } else if (row.type === "ethnicity") {
        const ethnicityY = y + (row.gapBefore || 0);
        const accent = ethnicityColor({ tribe: row.label });
        const destination = ethnicityLinks.find(
          (item) => item.storeId === row.storeId && item.label === row.label
        )?.destination;
        pdf.setFillColor(...mixWithWhite(accent, 0.86));
        pdf.roundedRect(x, ethnicityY, width, 8, 1, 1, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.3);
        pdf.setTextColor(...accent);
        pdf.text(
          truncatePdfLines(pdf, pdfSafeText(row.label).toUpperCase(), row.continuation ? width - 24 : width - 6, 1),
          x + 3,
          ethnicityY + 5.4
        );
        if (row.continuation) {
          pdf.setFontSize(5.2);
          pdf.text("CONT.", x + width - 3, ethnicityY + 5.4, {
            align: "right",
          });
        }
        if (destination) {
          pdf.link(x, ethnicityY, width, 8, {
            pageNumber: destination.pageNumber,
            top: destination.top,
            zoom: 1,
          });
        }
      } else {
        const accent = ethnicityColor(row.product);
        pdf.setFillColor(...accent);
        pdf.rect(x, y, 1.8, row.height, "F");
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.4);
        pdf.setTextColor(45, 62, 57);
        pdf.text(truncatePdfLines(pdf, row.product.name, 63, 1), x + 4, y + 5.5);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(6.4);
        pdf.setTextColor(...accent);
        pdf.text(pdfSafeText(row.product.sku || "-"), x + width - 2, y + 5.5, { align: "right" });
        const destination = productDestinations.get(row.product);
        if (destination) {
          pdf.link(x, y, width, row.height, {
            pageNumber: destination.pageNumber,
            top: destination.top,
            zoom: 1,
          });
        }
      }
      y += row.height;
    });
  });

  pdf.setDrawColor(220, 229, 226);
  pdf.line(12, 282, 198, 282);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(113, 128, 123);
  pdf.text(`${pdfSafeText(storeName)} Wholesale`, 12, 288);
  pdf.text(`Index  |  ${pageNumber}/${pageCount}`, 198, 288, { align: "right" });
  drawGenerationStamp(pdf, generatedAtLabel);
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
  const pageCount =
    1 +
    categoryGroups.reduce(
      (total, group) => total + Math.ceil(group.products.length / 2),
      0
    );
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

  let logo = null;
  try {
    logo = await loadPdfLogo();
  } catch {
    // A text fallback is drawn when the local brand asset cannot be loaded.
  }

  let coverBackground = null;
  try {
    coverBackground = await fetchPdfAsset("/catalog-cover-background/catalog-cover-background.png", {
      cache: "no-store",
    });
  } catch {
    // The green covers remain solid until the optional background file is added.
  }

  let coverDecoration = null;
  try {
    coverDecoration = await fetchPdfAsset(
      "/catalog-cover-decoration/catalog-cover-decoration.png",
      { cache: "no-store" }
    );
  } catch {
    // The black cover bar remains clean until the optional decoration is added.
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
    coverBackground,
    coverDecoration,
    contactIcons,
    products,
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
