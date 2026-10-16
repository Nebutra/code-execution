import {
  SandboxRuntime,
  readSandboxDebug
} from "./chunk-6UZA3GQP.js";

// src/cli.ts
var command = process.argv[2] ?? "doctor";
var runtime = SandboxRuntime.fromConfig();
if (command === "doctor") {
  process.stdout.write(
    `${JSON.stringify({ capability: "sandbox-runtime", results: await runtime.doctor() }, null, 2)}
`
  );
} else if (command === "debug") {
  process.stdout.write(
    `${JSON.stringify({ capability: "sandbox-runtime", entries: await readSandboxDebug() }, null, 2)}
`
  );
} else if (command === "plan") {
  const task = process.argv.slice(3).join(" ") || "echo sandbox ok";
  process.stdout.write(
    `${JSON.stringify({ capability: "sandbox-runtime", task, plan: runtime.plan({ cmd: task }) }, null, 2)}
`
  );
} else {
  process.stderr.write(`Unknown sandbox-runtime command: ${command}
`);
  process.exitCode = 1;
}
//# sourceMappingURL=cli.js.map