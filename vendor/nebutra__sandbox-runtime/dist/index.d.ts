interface ExecHints {
    readonly durationS?: number;
    readonly needsGpu?: boolean;
    readonly networkAccess?: boolean;
}
interface ExecRequest {
    readonly cmd: string;
    readonly filesIn?: Record<string, string>;
    readonly hints?: ExecHints;
    readonly tenantId?: string;
    readonly threadId?: string;
}
interface ExecResponse {
    readonly exitCode: number;
    readonly aggregatedOutput: string;
    readonly executedOn: string;
}
interface SandboxHealth {
    readonly provider: string;
    readonly ok: boolean;
    readonly suggestion?: string;
}
interface Sandbox {
    readonly id: string;
    exec(request: ExecRequest): Promise<ExecResponse>;
    doctor(): Promise<SandboxHealth>;
}
interface RouteRule {
    readonly when: Partial<ExecHints>;
    readonly provider: string;
}
interface SandboxRuntimeConfig {
    readonly providers?: readonly Sandbox[];
    readonly routes?: readonly RouteRule[];
}
declare function sandboxDebugPath(): string;
declare function createLocalMacSandbox(options?: {
    endpoint?: string;
    fetch?: typeof fetch;
}): Sandbox;
declare function createRemotePlaceholder(id: "remote_code" | "remote_gpu" | "remote_workspace", envKey: string): Sandbox;
declare class SandboxRuntime {
    #private;
    constructor(config?: SandboxRuntimeConfig);
    static fromConfig(config?: SandboxRuntimeConfig): SandboxRuntime;
    plan(request: ExecRequest): {
        provider: string;
        reason: string;
    };
    exec(request: ExecRequest): Promise<ExecResponse>;
    doctor(): Promise<SandboxHealth[]>;
}
declare function readSandboxDebug(limit?: number): Promise<unknown[]>;

export { type ExecHints, type ExecRequest, type ExecResponse, type RouteRule, type Sandbox, type SandboxHealth, SandboxRuntime, type SandboxRuntimeConfig, createLocalMacSandbox, createRemotePlaceholder, readSandboxDebug, sandboxDebugPath };
