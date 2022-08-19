const esbuild = require("esbuild");
const sveltePlugin = require("esbuild-svelte");
const sveltePreprocess = require("svelte-preprocess");
const falWorks = require("@fal-works/esbuild-plugin-global-externals");

// Decide which mode to proceed with
let mode = "build";
process.argv.slice(2).forEach(arg => {
  if (arg === "--watch") {
    mode = "watch";
  } else if (arg === "--deploy") {
    mode = "deploy";
  }
});
// original esbuild elixir wrapper had these args:
//    ~w(js/app.js --bundle --target=es2016 --outdir=../priv/static/assets
//--external:/fonts/* --external:/images/*),
const globals = {
  babylonjs: {
    varName: "BABYLON",
    type: "cjs",
  },
  "babylonjs-materials": {
    varName: "BABYLON",
    type: "cjs",
  },
  "babylonjs-gui": {
    varName: "BABYLON.GUI",
    type: "cjs",
  },
  "agora-rtc-sdk-ng": {
    varName: "AgoraRTC",
    namedExports: [
      "IAgoraRTCClient",
      "IAgoraRTCRemoteUser",
      "ILocalVideoTrack",
      "IMicrophoneAudioTrack",
      "IRemoteAudioTrack",
      "IRemoteVideoTrack",
    ],
    type: "cjs",
  },
  "ammojs-typed": {
    varName: "Ammo",
    type: "cjs",
  },
};

// Define esbuild options + extras for watch and deploy
let opts = {
  entryPoints: ["js/app.js", "js/orchestrator.ts", "js/spec.ts"],
  bundle: true,
  external: ["/fonts/*", "/images/*"],
  logLevel: "info",
  target: "es2016",
  outdir: "../priv/static/assets",
  plugins: [
    sveltePlugin({
      preprocess: sveltePreprocess(),
    }),
    falWorks.globalExternals(globals),
  ],
};
if (mode === "watch") {
  opts = {
    watch: true,
    sourcemap: "inline",
    ...opts,
  };
}
if (mode === "deploy") {
  opts = {
    minify: true,
    ...opts,
  };
}

// Start esbuild with previously defined options
// Stop the watcher when STDIN gets closed (no zombies please!)
esbuild
  .build(opts)
  .then(result => {
    if (mode === "watch") {
      process.stdin.pipe(process.stdout);
      process.stdin.on("end", () => {
        result.stop();
      });
    }
  })
  .catch(error => {
    process.exit(1);
  });
