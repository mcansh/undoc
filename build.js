#!/usr/bin/env node
const { build } = require("esbuild");
const { dtsPlugin } = require("esbuild-plugin-d.ts");

build({
  entryPoints: ["./src/index.ts"],
  outdir: "./dist",
  format: "cjs",
  bundle: true,
  platform: "node",
  sourcemap: true,
  plugins: [dtsPlugin()],
  target: "node12.0",
  watch: !!process.env.WATCH,
});
