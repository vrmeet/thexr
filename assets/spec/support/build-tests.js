const fg = require("fast-glob");
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");
const sveltePlugin = require("esbuild-svelte");
const sveltePreprocess = require("svelte-preprocess");
const gaze = require("gaze");

// const externalPackages = ['react', 'react-dom'];
// let makePackagesExternalPlugin = {
//   name: 'make-packages-external',
//   setup(build) {
//     let filter = /.*/;
//     build.onResolve({ namespace: 'file', filter }, (args) => {
//       // To allow sub imports from packages we take only the first path to deduct the name
//       let moduleName = args.path.split('/')[0];

//       // In case of scoped package
//       if (args.path.startsWith('@')) {
//         const split = args.path.split('/');
//         moduleName = `${split[0]}/${split[1]}`;
//       }

//       if (externalPackages.includes(moduleName)) {
//         return { path: args.path, external: true };
//       }

//       return null;
//     });
//   },
// };
// Decide which mode to proceed with
let mode = "build";
process.argv.slice(2).forEach((arg) => {
  if (arg === "--watch") {
    mode = "watch";
  }
});
const bundleTestFiles = () => {
  const allTestFiles = fg
    .sync(path.resolve(__dirname, `../**/*.spec.ts`))
    .map((f) => f.replace(path.resolve(__dirname, "../") + "/", "./"));
  const importsFileStr = allTestFiles
    .map((file) => `require('${file}');`)
    .join("\n");

  fs.writeFileSync(
    path.resolve(__dirname, "../test-files-index.ts"),
    importsFileStr
  );
};
const transpileBundledTestFile = () => {
  let opts = {
    bundle: true,
    sourcemap: "inline",
    entryPoints: [path.resolve(__dirname, "../test-files-index.ts")],
    outfile: path.resolve(__dirname, "../test-files-index.spec.js"),
    external: ["require", "fs", "path"],
    plugins: [
      sveltePlugin({
        preprocess: sveltePreprocess(),
      }),
    ],
  };
  esbuild.build(opts);
};

if (mode === "watch") {
  bundleTestFiles();
  transpileBundledTestFile();
  console.log("i'm wating for changes");
  gaze(path.resolve(__dirname, "../../**/*.ts"), (a, b) => {
    b.on("all", (event, filepath) => {
      console.log(filepath, event);
      if (filepath.endsWith("test-files-index.ts")) {
        // the bundle was changed to make the ts -> js version of it for jasmine runner
        transpileBundledTestFile();
      } else {
        // some other ts file was changed, accumulate all files into a bundle
        // the next pass will make it js for jasmine
        bundleTestFiles();
      }
    });
  });
} else {
  bundleTestFiles();
}
// .then(() => {
//   fs.unlinkSync("./test-files-index.ts");
// });
