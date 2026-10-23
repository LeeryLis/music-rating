import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf-8"));
const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));

if (pkg.version !== manifest.version) {
    pkg.version = manifest.version;
    fs.writeFileSync("package.json", JSON.stringify(pkg, null, 4) + "\n");
    console.log(`package.json → ${manifest.version}`);
} else {
    console.log(`Versions already in sync: ${manifest.version}`);
}