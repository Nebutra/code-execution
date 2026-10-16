// src/index.ts
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { appendCapabilityDebug } from "@nebutra/capability-kit/debug";
import { CapabilityError } from "@nebutra/errors";
import { blake3 } from "@noble/hashes/blake3.js";
import { bytesToHex } from "@noble/hashes/utils.js";
function hashContent(content) {
  return bytesToHex(blake3(new TextEncoder().encode(content)));
}
async function appendJsonl(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value)}
`, { flag: "a" });
}
async function readJsonl(path) {
  try {
    const raw = await readFile(path, "utf8");
    return raw.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}
var EventLog = class _EventLog {
  #root;
  #tenantId;
  #summarize;
  constructor(root, tenantId, summarize) {
    this.#root = root;
    this.#tenantId = tenantId;
    this.#summarize = summarize;
  }
  static async open(root, options = {}) {
    const log = new _EventLog(
      root,
      options.tenantId ?? "local",
      options.summarize ?? (async (event) => `${event.kind} touched ${event.affected.length} path(s)`)
    );
    await mkdir(log.objectsRoot(), { recursive: true });
    return log;
  }
  objectsRoot() {
    return join(this.#root, "objects", this.#tenantId);
  }
  eventsPath() {
    return join(this.#root, "events", `${this.#tenantId}.jsonl`);
  }
  branchesPath() {
    return join(this.#root, "branches", `${this.#tenantId}.jsonl`);
  }
  async commit(event) {
    const objectHashes = [];
    for (const [path, content] of Object.entries(event.snapshot ?? {})) {
      const hash = hashContent(content);
      objectHashes.push(hash);
      await writeFile(join(this.objectsRoot(), hash), content, "utf8");
      await appendJsonl(join(this.objectsRoot(), "index.jsonl"), { hash, path });
    }
    const id = hashContent(
      JSON.stringify({ event, objectHashes, tenantId: this.#tenantId, at: Date.now() })
    );
    const record = {
      ...event,
      id,
      tenantId: this.#tenantId,
      at: (/* @__PURE__ */ new Date()).toISOString(),
      summary: await this.#summarize(event),
      objectHashes
    };
    await appendJsonl(this.eventsPath(), record);
    await appendCapabilityDebug("event-log", { ...record });
    return id;
  }
  async timeline() {
    return readJsonl(this.eventsPath());
  }
  async rollbackTo(id) {
    const target = (await this.timeline()).find((event) => event.id === id);
    if (!target) {
      throw new CapabilityError("event-log", "Rollback target not found", {
        suggestion: "Run `pnpm chronos:timeline` and choose an event id from the current tenant.",
        metadata: { id },
        statusCode: 404
      });
    }
    return {
      dryRun: true,
      target: id,
      affected: target.affected,
      suggestion: "Review this plan, then call an explicit apply API in a higher layer."
    };
  }
  async branchFrom(id, name) {
    const exists = (await this.timeline()).some((event) => event.id === id);
    if (!exists) {
      throw new CapabilityError("event-log", "Branch source not found", {
        suggestion: "Run `pnpm chronos:timeline` and branch from an existing event id.",
        metadata: { id },
        statusCode: 404
      });
    }
    const branch = { name, from: id, at: (/* @__PURE__ */ new Date()).toISOString() };
    await appendJsonl(this.branchesPath(), branch);
    return branch;
  }
};

export {
  EventLog
};
//# sourceMappingURL=chunk-L5NN4BRT.js.map