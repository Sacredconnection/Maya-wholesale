const COUNTRY_CODES = `
AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY PW BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI KH CM CA CV KY CF TD CL CN CX CC CO KM CG CD CK CR HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM HN HK HU IS IN ID IR IQ IE IM IL IT CI JM JP JE JO KZ KE KI XK KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF KP MK MP NO OM PK PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW ST BL SH KN LC SX MF PM VC WS SM SA SN RS SC SL SG SK SI SB SO ZA GS KR SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VA VE VN VG VI WF EH YE ZM ZW
`.trim().split(/\s+/);

// WooCommerce uses a few familiar labels that differ from Intl.DisplayNames.
const COUNTRY_NAME_OVERRIDES = {
  AG: "Antigua and Barbuda",
  BA: "Bosnia and Herzegovina",
  BL: "Saint Barthélemy",
  BQ: "Bonaire, Saint Eustatius and Saba",
  CD: "Congo (Kinshasa)",
  CG: "Congo (Brazzaville)",
  CI: "Ivory Coast",
  CZ: "Czech Republic",
  GB: "United Kingdom (UK)",
  GS: "South Georgia/Sandwich Islands",
  HK: "Hong Kong",
  HM: "Heard Island and McDonald Islands",
  KN: "Saint Kitts and Nevis",
  KP: "North Korea",
  KR: "South Korea",
  LA: "Laos",
  LC: "Saint Lucia",
  MD: "Moldova",
  MF: "Saint Martin (French part)",
  MM: "Myanmar",
  MO: "Macao",
  PM: "Saint Pierre and Miquelon",
  PN: "Pitcairn",
  PS: "Palestinian Territory",
  PW: "Belau",
  RE: "Reunion",
  SH: "Saint Helena",
  SJ: "Svalbard and Jan Mayen",
  ST: "São Tomé and Príncipe",
  SX: "Saint Martin (Dutch part)",
  TC: "Turks and Caicos Islands",
  TT: "Trinidad and Tobago",
  UM: "United States (US) Minor Outlying Islands",
  US: "United States (US)",
  VA: "Vatican",
  VC: "Saint Vincent and the Grenadines",
  VG: "Virgin Islands (British)",
  VI: "Virgin Islands (US)",
  WF: "Wallis and Futuna",
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export const COUNTRIES = COUNTRY_CODES.map((code) => ({
  code,
  name: COUNTRY_NAME_OVERRIDES[code] || regionNames.of(code) || code,
}));

const COUNTRY_CODE_SET = new Set(COUNTRY_CODES);

export const isSupportedCountryCode = (value) =>
  typeof value === "string" && COUNTRY_CODE_SET.has(value.toUpperCase());
