export const ETHNICITY_COLORS = {
  apurina: "#4A730D",
  caboclo: "#40271E",
  "huni-kuin": "#A67244",
  katukina: "#214001",
  kuntanawa: "#54575C",
  nukini: "#E09A1E",
  puyanawa: "#402C23",
  shanenawa: "#0367A6",
  shawadawa: "#731414",
  yawanawa: "#BF7E04",
  shamanic: "#686849",
  "shamanic-snuff": "#686849",
  "shamanic-blend": "#686849",
  "shamanic-tobacco-free": "#1D7773",
  "shamanic-tobaccofree": "#1D7773",
};

export const DEFAULT_ETHNICITY_COLOR = "#18322E";

const normalizeEthnicityKey = (name) =>
  (name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function getEthnicityColor(...names) {
  for (const name of names) {
    const color = ETHNICITY_COLORS[normalizeEthnicityKey(name)];
    if (color) return color;
  }

  return DEFAULT_ETHNICITY_COLOR;
}
