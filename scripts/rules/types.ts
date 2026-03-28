export interface RuleResult {
  pass: boolean;
  message: string;
  file?: string;
  line?: number;
}

export interface Rule {
  name: string;
  description: string;
  category: 'docs' | 'components' | 'tokens' | 'structure';
  /** When true, failures are reported as warnings and don't affect exit code */
  warnOnly?: boolean;
  run: () => Promise<RuleResult[]>;
}
