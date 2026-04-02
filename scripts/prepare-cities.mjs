#!/usr/bin/env node
/**
 * Downloads GeoNames cities1000 dataset and processes it into a compact JSON
 * for server-side city search. The cities1000 dataset contains ~145,000 cities
 * with population > 1,000, covering small towns worldwide.
 *
 * Run: node scripts/prepare-cities.mjs
 * Source: https://download.geonames.org/export/dump/ (Creative Commons Attribution 4.0)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const DATA_DIR = join(PROJECT_ROOT, "data");
const OUTPUT_FILE = join(DATA_DIR, "cities.json");
const TMP_DIR = "/tmp/geonames-prep";
const ZIP_FILE = join(TMP_DIR, "cities1000.zip");
const TSV_FILE = join(TMP_DIR, "cities1000.txt");

if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

console.log("Downloading GeoNames cities1000 data...");
execSync(
  `curl -L -o "${ZIP_FILE}" https://download.geonames.org/export/dump/cities1000.zip`,
  { stdio: "inherit" }
);

console.log("Extracting...");
execSync(`unzip -o "${ZIP_FILE}" -d "${TMP_DIR}"`, { stdio: "inherit" });

console.log("Processing TSV data...");
const raw = readFileSync(TSV_FILE, "utf-8");
const lines = raw.split("\n").filter((l) => l.trim());

const tzSet = new Set();
const ccSet = new Set();
const entries = [];

/**
 * GeoNames TSV columns:
 *  0: geonameid, 1: name, 2: asciiname, 3: alternatenames,
 *  4: latitude, 5: longitude, 6: feature class, 7: feature code,
 *  8: country code, 9: cc2, 10-13: admin codes, 14: population,
 *  15: elevation, 16: dem, 17: timezone, 18: modification date
 */
for (const line of lines) {
  const cols = line.split("\t");
  if (cols.length < 18) continue;

  const name = cols[1];
  const asciiName = cols[2];
  const cc = cols[8];
  const population = parseInt(cols[14]) || 0;
  const tz = cols[17];

  if (!name || !cc || !tz) continue;

  tzSet.add(tz);
  ccSet.add(cc);
  entries.push({
    name,
    ascii: asciiName.toLowerCase(),
    cc,
    tz,
    pop: population,
  });
}

const tzList = Array.from(tzSet).sort();
const ccList = Array.from(ccSet).sort();
const tzMap = new Map(tzList.map((t, i) => [t, i]));
const ccMap = new Map(ccList.map((c, i) => [c, i]));

// Compact format: [name, asciiLower, countryIdx, timezoneIdx, population]
const cities = entries.map((e) => [
  e.name,
  e.ascii,
  ccMap.get(e.cc),
  tzMap.get(e.tz),
  e.pop,
]);

const output = { tz: tzList, cc: ccList, cities };
writeFileSync(OUTPUT_FILE, JSON.stringify(output));

const sizeMB = (readFileSync(OUTPUT_FILE).length / 1024 / 1024).toFixed(1);
console.log(`\nDone! Processed ${cities.length} cities`);
console.log(`Output: ${OUTPUT_FILE} (${sizeMB} MB)`);
console.log(`Timezones: ${tzList.length}, Countries: ${ccList.length}`);

// Cleanup
try {
  unlinkSync(ZIP_FILE);
  unlinkSync(TSV_FILE);
} catch {
  // ignore cleanup errors
}
