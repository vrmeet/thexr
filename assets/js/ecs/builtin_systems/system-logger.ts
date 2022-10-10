/* eslint-disable no-fallthrough */
import type { Context } from "../../context";
import type { SignalHub } from "../../signalHub";
import type { ISystem } from "./isystem";
import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";

enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

const WALL_HEIGHT = 10;
const WALL_WIDTH = 20;

export class SystemLogger implements ISystem {
  public name = "logger";
  public order = 3;
  public scene: BABYLON.Scene;
  public signalHub: SignalHub;
  public recentLogs: any[];
  public logLevel = LogLevel.INFO;
  public logPlane: BABYLON.AbstractMesh;
  public logTexture: GUI.AdvancedDynamicTexture;
  public textBlock: GUI.TextBlock;
  init(context: Context) {
    this.recentLogs = [];
    this.scene = context.scene;
    this.signalHub = context.signalHub;
    this.overRideWindowConsole();
    this.signalHub.local.on("menu_event").subscribe((value) => {
      if (value === "logger_opened") {
        this.createLogGui();
      } else if (value === "logger_closed") {
        this.removeLogGui();
      }
    });
  }

  removeLogGui() {
    this.logTexture?.dispose();
    this.logPlane?.dispose();
    this.logTexture = null;
    this.logPlane = null;
    this.textBlock = null;
  }

  createLogGui() {
    this.logPlane = BABYLON.MeshBuilder.CreatePlane(
      "logger-plane",
      {
        height: WALL_HEIGHT,
        width: WALL_WIDTH,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
      },
      this.scene
    );
    this.logPlane.isPickable = false;
    this.logPlane.showBoundingBox = true;
    this.logPlane.position.y = Math.ceil(WALL_HEIGHT / 2);
    this.logPlane.rotation.x = BABYLON.Angle.FromDegrees(-15).radians();

    this.logTexture = GUI.AdvancedDynamicTexture.CreateForMesh(
      this.logPlane,
      WALL_WIDTH * 100,
      WALL_HEIGHT * 100
    );
    this.logTexture.background = "#F0F0F0";

    this.textBlock = new GUI.TextBlock("logs", this.recentLogsAsText());
    this.textBlock.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.textBlock.textHorizontalAlignment =
      GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

    this.logTexture.addControl(this.textBlock);
  }

  overRideWindowConsole() {
    const old_console_debug = window.console.debug;
    const old_console_log = window.console.log;
    const old_console_info = window.console.info;
    const old_console_warn = window.console.warn;
    const old_console_error = window.console.error;
    // based on the logLevel, enhance the window console
    // with piggy-backing to capture logs for display on
    // a texture
    switch (this.logLevel) {
      case LogLevel.DEBUG:
        window.console.debug = (...args) => {
          const newArgs = [this.getTimestamp(), ...args];
          old_console_debug(...args);
          this.addLog(...newArgs);
        };
      case LogLevel.INFO:
        window.console.info = (...args) => {
          const newArgs = [this.getTimestamp(), ...args];
          old_console_info(...args);
          this.addLog(...newArgs);
        };
        window.console.log = (...args) => {
          const newArgs = [this.getTimestamp(), ...args];
          old_console_log(...args);
          this.addLog(...newArgs);
        };
      case LogLevel.WARN:
        window.console.warn = (...args) => {
          const newArgs = [this.getTimestamp(), ...args];
          old_console_warn(...args);
          this.addLog(...newArgs);
          this.flashError(...args);
        };
      case LogLevel.ERROR:
        window.console.error = (...args) => {
          const newArgs = [this.getTimestamp(), ...args];
          old_console_error(...args);
          this.addLog(...newArgs);
          this.flashError(...args);
        };
    }
  }

  addLog(...args) {
    this.recentLogs = [args, ...this.recentLogs.slice(0, 99)];
    if (this.textBlock) {
      this.textBlock.text = this.recentLogsAsText();
    }
    // this.signalHub.local.emit("new_log", {});
  }

  recentLogsAsText() {
    return this.recentLogs.map((row) => this.rowToString(row)).join("\n");
  }

  flashError(...args) {
    this.signalHub.incoming.emit("hud_msg", this.rowToString(args));
  }

  rowToString(row: any[]) {
    return row
      .map((col) => {
        if (typeof col === "string") {
          return col;
        } else {
          try {
            return JSON.stringify(col);
          } catch (e) {
            return `${e} - ${col}`;
          }
        }
      })
      .join(" ");
  }

  getTimestamp() {
    const d = new Date();
    return `${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`;
  }
}
