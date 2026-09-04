interface RobotsRule {
  directive: 'allow' | 'disallow';
  pattern: string;
}

interface RobotsGroup {
  agents: string[];
  rules: RobotsRule[];
}

const escapeRegex = (value: string) => value.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

function ruleMatches(pathWithQuery: string, pattern: string): boolean {
  if (!pattern) return false;
  const anchored = pattern.endsWith('$');
  const raw = anchored ? pattern.slice(0, -1) : pattern;
  const regex = raw.split('*').map(escapeRegex).join('.*');
  return new RegExp(`^${regex}${anchored ? '$' : ''}`).test(pathWithQuery);
}

export class RobotsPolicy {
  private groups: RobotsGroup[];

  constructor(content: string, private userAgent: string) {
    this.groups = RobotsPolicy.parse(content);
  }

  static parse(content: string): RobotsGroup[] {
    const groups: RobotsGroup[] = [];
    let agents: string[] = [];
    let rules: RobotsRule[] = [];

    const flush = () => {
      if (agents.length > 0) groups.push({ agents, rules });
      agents = [];
      rules = [];
    };

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.replace(/#.*$/, '').trim();
      if (!line) continue;
      const separator = line.indexOf(':');
      if (separator < 0) continue;
      const field = line.slice(0, separator).trim().toLowerCase();
      const value = line.slice(separator + 1).trim();

      if (field === 'user-agent') {
        if (rules.length > 0) flush();
        agents.push(value.toLowerCase());
      } else if ((field === 'allow' || field === 'disallow') && agents.length > 0) {
        rules.push({ directive: field, pattern: value });
      }
    }
    flush();
    return groups;
  }

  isAllowed(url: string): boolean {
    if (this.groups.length === 0) return true;
    const agent = this.userAgent.toLowerCase();
    const matching = this.groups
      .map((group) => ({
        group,
        specificity: Math.max(...group.agents.map((candidate) => candidate === '*' ? 0 : agent.includes(candidate) ? candidate.length : -1)),
      }))
      .filter((entry) => entry.specificity >= 0);
    if (matching.length === 0) return true;

    const bestSpecificity = Math.max(...matching.map((entry) => entry.specificity));
    const rules = matching
      .filter((entry) => entry.specificity === bestSpecificity)
      .flatMap((entry) => entry.group.rules);
    const parsed = new URL(url);
    const target = `${parsed.pathname}${parsed.search}`;
    const applicable = rules.filter((rule) => ruleMatches(target, rule.pattern));
    if (applicable.length === 0) return true;

    const longest = Math.max(...applicable.map((rule) => rule.pattern.replace(/\$$/, '').length));
    const strongest = applicable.filter((rule) => rule.pattern.replace(/\$$/, '').length === longest);
    return strongest.some((rule) => rule.directive === 'allow');
  }
}
