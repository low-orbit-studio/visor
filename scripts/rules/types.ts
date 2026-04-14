export interface RuleResult {
  pass: boolean;
  message: string;
  file?: string;
  line?: number;
  /** Numeric score emitted by scoring rules (e.g. discoverability-score). 0–10 per dimension, 0–100 for totals. */
  score?: number;
}

export interface Rule {
  name: string;
  description: string;
  category: 'docs' | 'components' | 'tokens' | 'structure';
  /** When true, failures are reported as warnings and don't affect exit code */
  warnOnly?: boolean;
  run: () => Promise<RuleResult[]>;
}
