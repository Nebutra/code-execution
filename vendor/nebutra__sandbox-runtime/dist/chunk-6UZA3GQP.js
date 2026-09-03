// src/index.ts
import {
  appendCapabilityDebug,
  capabilityDebugPath,
  readCapabilityDebug
} from "@nebutra/capability-kit/debug";
import { CapabilityError } from "@nebutra/errors";
import pLimit from "p-limit";
var SANDBOX_DOCTOR_CONCURRENCY = 4;
function sandboxDebugPath() {
  return capabilityDebugPath("sandbox-runtime");
}
async function appendSandboxDebug(entry) {
  await appendCapabilityDebug("sandbox-runtime", entry);
}
function createLocalMacSandbox(options = {}) {
  const endpoint = options.endpoint ?? process.env.SANDBOX_RUNTIME_LOCAL_URL ?? "http://127.0.0.1:8020/api/v1/sandbox/exec";
  const fetchImpl = options.fetch ?? fetch;
  return {
    id: "local_mac",
    async exec(request) {
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tenantId: request.tenantId ?? "local",
          threadId: request.threadId ?? "local",
          command: request.cmd,
          capabilityPolicy: {
            kind: "external_sandbox",
            network_access: request.hints?.networkAccess ?? false
          }
        })
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new CapabilityError(
          "sandbox-runtime",
          `Local sandbox refused execution (${response.status})`,
          {
            suggestion: "Start the Rust sandbox service or route this task to a configured remote provider.",
            metadata: { detail },
            statusCode: response.status
          }
        );
      }
      const result = await response.json();
      await appendSandboxDebug({
        type: "exec",
        provider: "local_mac",
        command: request.cmd,
        result
      });
      return result;
    },
    async doctor() {
      try {
        const result = await this.exec({ cmd: "echo sandbox ok" });
        return { provider: "local_mac", ok: result.exitCode === 0 };
      } catch (error) {
        return {
          provider: "local_mac",
          ok: false,
          suggestion: error instanceof Error ? error.message : "Check local sandbox service reachability."
        };
      }
    }
  };
}
function createRemotePlaceholder(id, envKey) {
  return {
    id,
    async exec() {
      throw new CapabilityError("sandbox-runtime", `${id} adapter is not configured`, {
        suggestion: `Set ${envKey} and wire the provider SDK before routing tasks to ${id}.`,
        statusCode: 503
      });
    },
    async doctor() {
      return process.env[envKey] ? { provider: id, ok: true } : { provider: id, ok: false, suggestion: `Set ${envKey} to enable ${id}.` };
    }
  };
}
var SandboxRuntime = class _SandboxRuntime {
  #providers = /* @__PURE__ */ new Map();
  #routes;
  constructor(config = {}) {
    for (const provider of config.providers ?? [
      createLocalMacSandbox(),
      createRemotePlaceholder("remote_code", "SANDBOX_REMOTE_CODE_TOKEN"),
      createRemotePlaceholder("remote_gpu", "SANDBOX_REMOTE_GPU_TOKEN"),
      createRemotePlaceholder("remote_workspace", "SANDBOX_REMOTE_WORKSPACE_TOKEN")
    ]) {
      this.#providers.set(provider.id, provider);
    }
    this.#routes = config.routes ?? [
      { when: { needsGpu: true }, provider: "remote_gpu" },
      { when: { durationS: 30 }, provider: "remote_code" },
      { when: { needsGpu: false }, provider: "local_mac" }
    ];
  }
  static fromConfig(config = {}) {
    return new _SandboxRuntime(config);
  }
  plan(request) {
    const hints = request.hints ?? {};
    for (const rule of this.#routes) {
      const matches = Object.entries(rule.when).every(
        ([key, value]) => hints[key] === value
      );
      if (matches && this.#providers.has(rule.provider)) {
        return { provider: rule.provider, reason: "matched static routing rule" };
      }
    }
    return {
      provider: this.#providers.has("local_mac") ? "local_mac" : Array.from(this.#providers.keys())[0] ?? "",
      reason: "default route"
    };
  }
  async exec(request) {
    const plan = this.plan(request);
    const provider = this.#providers.get(plan.provider);
    if (!provider) {
      throw new CapabilityError("sandbox-runtime", "No sandbox provider available", {
        suggestion: "Configure at least one sandbox provider before executing commands.",
        metadata: plan
      });
    }
    return provider.exec(request);
  }
  async doctor() {
    const limit = pLimit(SANDBOX_DOCTOR_CONCURRENCY);
    return Promise.all(
      Array.from(this.#providers.values()).map((provider) => limit(() => provider.doctor()))
    );
  }
};
async function readSandboxDebug(limit = 10) {
  return readCapabilityDebug("sandbox-runtime", { limit });
}

export {
  sandboxDebugPath,
  createLocalMacSandbox,
  createRemotePlaceholder,
  SandboxRuntime,
  readSandboxDebug
};
//# sourceMappingURL=chunk-6UZA3GQP.js.map