import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import fs from "node:fs";
import path from "node:path";

const prod = process.argv[2] === "production";

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf-8"));
const outDir = path.join("dist", manifest.id);

const banner = `/*
Music Rating - bundled by esbuild.
*/`;

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const ctx = await esbuild.context({
    banner: { js: banner },
    entryPoints: ["src/main.ts"],
    bundle: true,
    external: [
        "obsidian",
        "electron",
        "@codemirror/autocomplete",
        "@codemirror/collab",
        "@codemirror/commands",
        "@codemirror/language",
        "@codemirror/lint",
        "@codemirror/search",
        "@codemirror/state",
        "@codemirror/view",
        "@lezer/common",
        "@lezer/highlight",
        "@lezer/lr",
        ...builtins
    ],
    format: "cjs",
    target: "es2018",
    logLevel: "info",
    sourcemap: prod ? false : "inline",
    treeShaking: true,
    outfile: path.join(outDir, "main.js"),
});

fs.copyFileSync("manifest.json", path.join(outDir, "manifest.json"));
if (fs.existsSync("styles.css")) {
    fs.copyFileSync("styles.css", path.join(outDir, "styles.css"));
}

if (prod) {
    await ctx.rebuild();
    process.exit(0);
} else {
    await ctx.watch();
}