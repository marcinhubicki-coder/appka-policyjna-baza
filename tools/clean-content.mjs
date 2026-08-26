#!/usr/bin/env node
import { cleanLegacyData, loadLegalData, saveLegalData } from "./legal-content.mjs";

const dataPath = process.argv.find((arg) => arg.startsWith("--data="))?.slice(7) || "data.js";
const write = process.argv.includes("--write");
const data = loadLegalData(dataPath);
const stats = cleanLegacyData(data);

console.log(JSON.stringify(stats, null, 2));
if (write) {
  saveLegalData(data, dataPath);
  console.log(`Zapisano ${dataPath}`);
} else {
  console.log("Tryb podglądu. Dodaj --write, aby zapisać zmiany.");
}
