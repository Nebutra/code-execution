import {
  EventLog
} from "./chunk-L5NN4BRT.js";

// src/cli.ts
var command = process.argv[2] ?? "doctor";
var log = await EventLog.open(process.env.EVENT_LOG_ROOT ?? ".nebutra/.chronos");
if (command === "doctor") {
  const timeline = await log.timeline();
  process.stdout.write(
    `${JSON.stringify(
      {
        capability: "event-log",
        ok: timeline.length > 0,
        events: timeline.length,
        ...timeline.length === 0 && {
          suggestion: "Run the Layer 0 demo to create the first event."
        }
      },
      null,
      2
    )}
`
  );
} else if (command === "timeline" || command === "debug") {
  process.stdout.write(
    `${JSON.stringify({ capability: "event-log", events: await log.timeline() }, null, 2)}
`
  );
} else {
  process.stderr.write(`Unknown event-log command: ${command}
`);
  process.exitCode = 1;
}
//# sourceMappingURL=cli.js.map