// src/index.ts
function wildcardMatch(str, pattern) {
  if (isOptionalTrailingStar(pattern)) {
    const head = pattern.slice(0, -2);
    if (globMatch(str, head)) {
      return true;
    }
    return globMatch(str, pattern);
  }
  return globMatch(str, pattern);
}
function isOptionalTrailingStar(pattern) {
  return pattern.length >= 2 && pattern.endsWith(" *");
}
function globMatch(str, pattern) {
  let s = 0;
  let p = 0;
  let starP = -1;
  let starS = 0;
  while (s < str.length) {
    const pc = p < pattern.length ? pattern[p] : void 0;
    if (pc === "*") {
      starP = p;
      starS = s;
      p += 1;
    } else if (pc === "?" || pc === str[s]) {
      p += 1;
      s += 1;
    } else if (starP !== -1) {
      p = starP + 1;
      starS += 1;
      s = starS;
    } else {
      return false;
    }
  }
  while (p < pattern.length && pattern[p] === "*") {
    p += 1;
  }
  return p === pattern.length;
}
function evaluate(permission, pattern, ...rulesets) {
  for (const ruleset of rulesets) {
    for (const rule of ruleset) {
      if (wildcardMatch(permission, rule.permission) && wildcardMatch(pattern, rule.pattern)) {
        return rule;
      }
    }
  }
  return { permission, pattern: "*", action: "ask" };
}
var BUILTIN_ARITY = Object.freeze({
  git: 2,
  npm: 2,
  "npm run": 3,
  docker: 2,
  kubectl: 2,
  cargo: 2,
  pnpm: 2,
  "pnpm run": 3,
  yarn: 2,
  "yarn run": 3,
  go: 2,
  ls: 1,
  cat: 1,
  cd: 1,
  rm: 1,
  cp: 1,
  mv: 1,
  mkdir: 1,
  echo: 1,
  grep: 1,
  python: 1,
  node: 1
});
function commandPrefix(tokens, arity) {
  if (tokens.length === 0) {
    return [];
  }
  const table = { ...BUILTIN_ARITY, ...arity ?? {} };
  for (let len = tokens.length; len >= 1; len -= 1) {
    const prefixKey = tokens.slice(0, len).join(" ");
    const take = table[prefixKey];
    if (take !== void 0) {
      return tokens.slice(0, Math.min(take, tokens.length));
    }
  }
  return tokens.slice(0, 1);
}
function commandPermissionKey(command) {
  const tokens = command.split(/\s+/).filter((token) => token.length > 0 && !token.startsWith("-"));
  return commandPrefix(tokens).join(" ");
}
var DEFAULT_SHELL_APPROVAL_RULES = Object.freeze([
  { match: /^rm\s+-rf\b/, requireApproval: "always", reason: "destructive recursive removal" },
  {
    match: /\b(format|mkfs)\b/,
    requireApproval: "always",
    reason: "destructive filesystem operation"
  },
  {
    match: /\bDROP\s+(DATABASE|SCHEMA|TABLE)\b/i,
    requireApproval: "always",
    reason: "destructive database operation"
  },
  {
    match: /\b(npm|pnpm|yarn)\s+publish\b/,
    requireApproval: "always",
    reason: "package publishing"
  },
  { match: /^git\s+push\b/, requireApproval: "once_per_session", reason: "remote git mutation" }
]);
function matchesShellApprovalRule(command, rule) {
  return typeof rule.match === "string" ? command.startsWith(rule.match) : rule.match.test(command);
}
function shellApprovalRequired(command, rules = DEFAULT_SHELL_APPROVAL_RULES) {
  return rules.find(
    (rule) => rule.requireApproval !== "never" && matchesShellApprovalRule(command, rule)
  ) ?? null;
}
export {
  BUILTIN_ARITY,
  DEFAULT_SHELL_APPROVAL_RULES,
  commandPermissionKey,
  commandPrefix,
  evaluate,
  matchesShellApprovalRule,
  shellApprovalRequired,
  wildcardMatch
};
//# sourceMappingURL=index.js.map