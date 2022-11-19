const fg = require("fast-glob");
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");
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
  let opts = {
    bundle: true,
    sourcemap: "inline",
    entryPoints: [path.resolve(__dirname, "../test-files-index.ts")],
    outfile: path.resolve(__dirname, "../test-files-index.spec.js"),
  };
  esbuild.build(opts);
};

if (mode === "watch") {
  console.log("i'm wating for changes");
  gaze(path.resolve(__dirname, "../../**/*.ts"), (a, b) => {
    b.on("all", (event, filepath) => {
      if (!filepath.endsWith("test-files-index.ts")) {
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
