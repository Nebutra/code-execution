/**
 * Permission ruleset evaluator.
 *
 * A small, pure, stateless re-expression of a two-dimensional wildcard
 * permission model plus a bash-command-prefix extractor. No global state,
 * no I/O, no mutation of inputs — every function is referentially transparent.
 *
 * The model has two independent dimensions per rule:
 *   - `permission` — the capability namespace (e.g. "bash", "edit", "net")
 *   - `pattern`    — the concrete subject within that namespace
 * A rule applies only when BOTH dimensions match the query via {@link wildcardMatch}.
 */
/** The decision a rule yields. Unknown queries fail safe to "ask". */
type Action = "allow" | "deny" | "ask";
/** A single permission rule. Both dimensions are matched as wildcard globs. */
interface Rule {
    permission: string;
    pattern: string;
    action: Action;
}
/** An ordered list of rules. Earlier rules take precedence. */
type Ruleset = Rule[];
/**
 * Anchored full-string glob matcher.
 *
 * Semantics:
 *   - `*` matches any run of characters, including the empty run.
 *   - `?` matches exactly one character.
 *   - Every other character is matched literally (regex metacharacters in
 *     `pattern` carry no special meaning).
 *   - The match is anchored: the entire `str` must be consumed.
 *
 * Special rule (ported faithfully): if `pattern` ends with `" *"` (a single
 * space immediately followed by `*`), that trailing ` *` is OPTIONAL. The
 * pattern then matches both `"<head> <rest>"` and exactly `"<head>"` with
 * nothing after it. For example `"git *"` matches `"git"` and `"git status"`.
 *
 * Implemented with a backtracking two-pointer scan whose `*` handling uses a
 * single saved restart position, giving O(|str| * |pattern|) worst case with
 * no catastrophic blow-up.
 */
declare function wildcardMatch(str: string, pattern: string): boolean;
/**
 * Resolve a permission query against one or more rulesets.
 *
 * Rulesets are concatenated in argument order (no mutation) and scanned
 * front-to-back. The FIRST rule whose `permission` and `pattern` both match
 * the query (via {@link wildcardMatch}) is returned. If no rule matches, a
 * fail-safe default is returned: the queried permission/pattern with action
 * `"ask"` (unknown → ask, never silently allow).
 */
declare function evaluate(permission: string, pattern: string, ...rulesets: Ruleset[]): Rule;
/**
 * Built-in command arity table. Maps a (possibly multi-word) command prefix
 * to the number of leading tokens that constitute its "human-understandable
 * command" for permission matching. Longest matching prefix wins.
 *
 * Frozen so the shared default cannot be mutated by callers.
 */
declare const BUILTIN_ARITY: Readonly<Record<string, number>>;
/**
 * Extract the human-understandable command from already-split, flag-free
 * shell tokens.
 *
 * Strategy: try the longest prefix first. For `len` from `tokens.length` down
 * to 1, if `tokens.slice(0, len).join(" ")` is a key in the (merged) arity
 * table, return `tokens.slice(0, arity[thatPrefix])`. If the tokens are empty,
 * return `[]`. Otherwise default to the first token only.
 *
 * `arity` is shallow-merged OVER the built-in table; neither the caller's
 * object nor the built-in table is mutated.
 */
declare function commandPrefix(tokens: string[], arity?: Record<string, number> | undefined): string[];
/**
 * Derive the `pattern` to feed {@link evaluate} for a bash permission.
 *
 * Splits `command` on arbitrary whitespace, drops tokens that begin with `-`
 * (flags are not conceptually part of the command identity), applies
 * {@link commandPrefix}, and joins the result with single spaces.
 */
declare function commandPermissionKey(command: string): string;
type ShellApprovalMode = "always" | "once_per_session" | "never";
interface ShellApprovalRule {
    readonly match: string | RegExp;
    readonly requireApproval: ShellApprovalMode;
    readonly reason: string;
}
declare const DEFAULT_SHELL_APPROVAL_RULES: readonly ShellApprovalRule[];
declare function matchesShellApprovalRule(command: string, rule: ShellApprovalRule): boolean;
declare function shellApprovalRequired(command: string, rules?: readonly ShellApprovalRule[]): ShellApprovalRule | null;

export { type Action, BUILTIN_ARITY, DEFAULT_SHELL_APPROVAL_RULES, type Rule, type Ruleset, type ShellApprovalMode, type ShellApprovalRule, commandPermissionKey, commandPrefix, evaluate, matchesShellApprovalRule, shellApprovalRequired, wildcardMatch };
