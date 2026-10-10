type EventKind = "llm_call" | "tool_call" | "sub_agent_call" | "content_write" | "sandbox_exec";
interface EventInput {
    readonly traceId: string;
    readonly kind: EventKind;
    readonly affected: readonly string[];
    readonly parent: string | null;
    readonly snapshot?: Record<string, string>;
}
interface EventRecord extends EventInput {
    readonly id: string;
    readonly tenantId: string;
    readonly at: string;
    readonly summary: string;
    readonly objectHashes: readonly string[];
}
interface BranchRecord {
    readonly name: string;
    readonly from: string;
    readonly at: string;
}
interface RollbackPlan {
    readonly dryRun: true;
    readonly target: string;
    readonly affected: readonly string[];
    readonly suggestion: string;
}
interface EventLogOptions {
    readonly tenantId?: string;
    readonly summarize?: (event: EventInput) => Promise<string>;
}
declare class EventLog {
    #private;
    private constructor();
    static open(root: string, options?: EventLogOptions): Promise<EventLog>;
    objectsRoot(): string;
    eventsPath(): string;
    branchesPath(): string;
    commit(event: EventInput): Promise<string>;
    timeline(): Promise<readonly EventRecord[]>;
    rollbackTo(id: string): Promise<RollbackPlan>;
    branchFrom(id: string, name: string): Promise<BranchRecord>;
}

export { type BranchRecord, type EventInput, type EventKind, EventLog, type EventLogOptions, type EventRecord, type RollbackPlan };
