import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(projectRoot, "index.html");
const videoPath = path.join(projectRoot, "assets", "matcha-pour.mp4");
const html = fs.readFileSync(htmlPath, "utf8");

const inlineStart = html.lastIndexOf("<script>");
const inlineEnd = html.lastIndexOf("</script>");
if (inlineStart < 0 || inlineEnd <= inlineStart) {
  throw new Error("Inline application script was not found.");
}

const script = html.slice(inlineStart + "<script>".length, inlineEnd);
new Function(script);

const ids = [...html.matchAll(/(?:^|\s)id="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicateIds.length) {
  throw new Error(`Duplicate IDs: ${duplicateIds.join(", ")}`);
}

const requiredTokens = [
  "scroll-track",
  "matchaVideo",
  "menuTabs",
  "cartDrawer",
  "WHATSAPP_NUMBER",
  "prefers-reduced-motion",
  'document.documentElement.dir = isArabic ? "rtl" : "ltr"',
];
const missingTokens = requiredTokens.filter((token) => !html.includes(token));
if (missingTokens.length) {
  throw new Error(`Missing required implementation tokens: ${missingTokens.join(", ")}`);
}

const video = fs.statSync(videoPath);
if (video.size < 100_000) {
  throw new Error("The hero video is missing or unexpectedly small.");
}

const menuItems = (html.match(/category:"/g) || []).length;
const arabicCharacters = (html.match(/[\u0600-\u06ff]/g) || []).length;
const replacementCharacters = (html.match(/�/g) || []).length;

if (menuItems !== 12) throw new Error(`Expected 12 menu items, found ${menuItems}.`);
if (arabicCharacters < 1_000) throw new Error("Arabic localization appears incomplete.");
if (replacementCharacters) throw new Error("Replacement characters were found in index.html.");

console.log("Inline JavaScript syntax: OK");
console.log("Duplicate IDs: none");
console.log(`Menu items: ${menuItems}`);
console.log(`Arabic characters: ${arabicCharacters}`);
console.log(`Hero video bytes: ${video.size}`);
console.log("Required interaction and accessibility tokens: present");
