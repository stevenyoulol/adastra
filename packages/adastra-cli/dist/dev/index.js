import {
  ThemeCommand,
  customLogger,
  getThemeVars,
  logInitiateSequence,
  startDevMessage,
  theme_flags_default
} from "../chunk-R6OUDM2D.js";

// src/commands/dev/index.ts
import { globalFlags } from "@shopify/cli-kit/node/cli";
import { execCLI2 } from "@shopify/cli-kit/node/ruby";
import { AbortController } from "@shopify/cli-kit/node/abort";
import { sleep } from "@shopify/cli-kit/node/system";
import {
  ensureAuthenticatedStorefront,
  ensureAuthenticatedThemes
} from "@shopify/cli-kit/node/session";
import { Flags } from "@oclif/core";
import { createServer } from "vite";
var _Dev = class extends ThemeCommand {
  constructor() {
    super(...arguments);
    this.ThemeRefreshTimeoutInMs = 110 * 60 * 1e3;
  }
  async run() {
    const { flags } = await this.parse(_Dev);
    const flagsToPass = this.passThroughFlags(flags, {
      allowedFlags: _Dev.cli2Flags
    });
    const { store, password, port } = getThemeVars(flags);
    const command = [
      "theme",
      "serve",
      flags.path,
      "--ignore",
      ..._Dev.ignoredFiles,
      ...flagsToPass,
      "--port",
      port
    ];
    let controller = new AbortController();
    const server = await createServer({
      customLogger: customLogger(store)
    });
    setInterval(() => {
      console.log(
        "Refreshing theme session token and restarting theme server..."
      );
      controller.abort();
      controller = new AbortController();
      this.execute(store, password, command, controller).then(
        async () => await server.restart()
      );
    }, this.ThemeRefreshTimeoutInMs);
    logInitiateSequence(store);
    startDevMessage(store);
    await server.listen();
    await this.execute(store, password, command, controller);
  }
  async execute(store, password, command, controller) {
    await sleep(2);
    const adminSession = await ensureAuthenticatedThemes(
      store,
      password,
      [],
      true
    );
    const storefrontToken = await ensureAuthenticatedStorefront([], password);
    return execCLI2(command, {
      adminSession,
      storefrontToken,
      signal: controller.signal
    });
  }
};
var Dev = _Dev;
Dev.description = "Lauches a Vite development server and uploads the current theme as a development theme to the connected store, While running, changes will push to the store in real time.";
Dev.flags = {
  ...globalFlags,
  path: theme_flags_default.path,
  host: Flags.string({
    description: "Set which network interface the web server listens on. The default value is 127.0.0.1.",
    env: "SHOPIFY_FLAG_HOST"
  }),
  "live-reload": Flags.string({
    description: `The live reload mode switches the server behavior when a file is modified:
- hot-reload Hot reloads local changes to CSS and sections (default)
- full-page  Always refreshes the entire page
- off        Deactivate live reload`,
    default: "hot-reload",
    options: ["hot-reload", "full-page", "off"],
    env: "SHOPIFY_FLAG_LIVE_RELOAD"
  }),
  poll: Flags.boolean({
    description: "Force polling to detect file changes.",
    env: "SHOPIFY_FLAG_POLL"
  }),
  "theme-editor-sync": Flags.boolean({
    char: "e",
    description: "Synchronize Theme Editor updates in the local theme files.",
    env: "SHOPIFY_FLAG_THEME_EDITOR_SYNC"
  }),
  port: Flags.string({
    description: "Local port to serve theme preview from.",
    env: "SHOPIFY_FLAG_PORT"
  }),
  store: theme_flags_default.store,
  theme: Flags.string({
    char: "t",
    description: "Theme ID or name of the remote theme.",
    env: "SHOPIFY_FLAG_THEME_ID"
  }),
  only: Flags.string({
    char: "o",
    multiple: true,
    description: "Hot reload only files that match the specified pattern.",
    env: "SHOPIFY_FLAG_ONLY"
  }),
  ignore: Flags.string({
    char: "x",
    multiple: true,
    description: "Skip hot reloading any files that match the specified pattern.",
    env: "SHOPIFY_FLAG_IGNORE"
  }),
  stable: Flags.boolean({
    hidden: true,
    description: "Performs the upload by relying in the legacy upload approach (slower, but it might be more stable in some scenarios)",
    env: "SHOPIFY_FLAG_STABLE"
  }),
  force: Flags.boolean({
    hidden: true,
    char: "f",
    description: "Proceed without confirmation, if current directory does not seem to be theme directory.",
    env: "SHOPIFY_FLAG_FORCE"
  }),
  password: theme_flags_default.password,
  mode: Flags.string({
    char: "m",
    description: "Load environment variables from specific env files.",
    env: "NODE_ENV"
  })
};
Dev.ignoredFiles = [
  "package.json",
  "jsconfig.*",
  "tsconfig.*",
  "src/",
  ".vscode",
  "node_modules"
];
Dev.cli2Flags = [
  "host",
  "live-reload",
  "poll",
  "theme-editor-sync",
  "port",
  "theme",
  "only",
  "ignore",
  "stable",
  "force"
];
export {
  Dev as default
};
