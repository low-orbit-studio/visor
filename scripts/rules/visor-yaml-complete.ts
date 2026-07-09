import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { parse } from 'yaml';
import type { Rule, RuleResult } from './types.js';

const REQUIRED_FIELDS = ['name', 'description', 'category', 'props', 'when_to_use'];

/** Fields that are advisory — missing triggers a warning via a separate warnOnly rule */
const ADVISORY_FIELDS = ['preview_url'];

export const visorYamlComplete: Rule = {
  name: 'visor-yaml-complete',
  description: '.visor.yaml files have required fields: name, description, category, props, when_to_use',
  category: 'structure',
  warnOnly: true,
  async run() {
    const results: RuleResult[] = [];

    for await (const filePath of glob('components/ui/**/*.visor.yaml')) {
      const content = await readFile(filePath, 'utf-8');
      let doc: Record<string, unknown>;

      try {
        doc = parse(content) as Record<string, unknown>;
      } catch {
        results.push({
          pass: false,
          message: 'Invalid YAML syntax',
          file: filePath,
        });
        continue;
      }

      const missing = REQUIRED_FIELDS.filter((f) => !(f in doc));

      if (missing.length > 0) {
        results.push({
          pass: false,
          message: `Missing required fields: ${missing.join(', ')}`,
          file: filePath,
        });
      } else {
        results.push({
          pass: true,
          message: 'All required fields present',
          file: filePath,
        });
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'No .visor.yaml files found',
      });
    }

    return results;
  },
};

/**
 * `design_ref` — the intrinsic trigger (W-111) for Visor's render-vs-design
 * self-check (see the "Component Build Workflow" section of `CLAUDE.md`). It
 * points at the operator-approved design fragment/mockup for a component: a
 * repo-relative path or a URL.
 *
 * Unlike `preview_url` (advisory-for-all — every component *should* eventually
 * carry one, so absence warns), `design_ref` is **conditional**: only components
 * built against an approved design carry it. Its *presence* is the signal, so
 * absence must be silent — nagging every component to add a design_ref it never
 * had would be noise. When present, this rule validates it *resolves* (non-empty
 * string; if a local path, the target exists), so a stale/typo'd reference can't
 * silently defeat the self-check.
 */
export const visorYamlDesignRef: Rule = {
  name: 'visor-yaml-design-ref',
  description:
    '.visor.yaml design_ref (when present) resolves to an existing approved-design reference — the default-on trigger for the render-vs-design self-check',
  category: 'structure',
  warnOnly: true,
  async run() {
    const results: RuleResult[] = [];

    for await (const filePath of glob('components/ui/**/*.visor.yaml')) {
      const content = await readFile(filePath, 'utf-8');
      let doc: Record<string, unknown>;

      try {
        doc = parse(content) as Record<string, unknown>;
      } catch {
        // Syntax errors are reported by visor-yaml-complete; skip here
        continue;
      }

      // Conditional field: silent when absent (most components have no approved
      // design). Only present-but-unresolvable references warn.
      if (!('design_ref' in doc)) {
        continue;
      }

      const ref = doc.design_ref;

      if (typeof ref !== 'string' || ref.trim() === '') {
        results.push({
          pass: false,
          message: 'design_ref must be a non-empty string (repo-relative path or URL to the approved design)',
          file: filePath,
        });
        continue;
      }

      const isUrl = /^(https?:)?\/\//.test(ref);
      if (isUrl) {
        results.push({ pass: true, message: 'design_ref present (URL)', file: filePath });
        continue;
      }

      // Local path — accept either .visor.yaml-relative or repo-root-relative.
      const relToYaml = resolve(dirname(filePath), ref);
      const relToRoot = isAbsolute(ref) ? ref : resolve(process.cwd(), ref);

      if (existsSync(relToYaml) || existsSync(relToRoot)) {
        results.push({
          pass: true,
          message: 'design_ref present (resolves to an existing file)',
          file: filePath,
        });
      } else {
        results.push({
          pass: false,
          message: `design_ref does not resolve to an existing file: ${ref}`,
          file: filePath,
        });
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'No component .visor.yaml carries a design_ref',
      });
    }

    return results;
  },
};

export const visorYamlPreviewUrl: Rule = {
  name: 'visor-yaml-preview-url',
  description: '.visor.yaml files have an optional preview_url for visual reference by multimodal AI agents',
  category: 'structure',
  warnOnly: true,
  async run() {
    const results: RuleResult[] = [];

    for await (const filePath of glob('components/ui/**/*.visor.yaml')) {
      const content = await readFile(filePath, 'utf-8');
      let doc: Record<string, unknown>;

      try {
        doc = parse(content) as Record<string, unknown>;
      } catch {
        // Syntax errors are reported by visor-yaml-complete; skip here
        continue;
      }

      const missingAdvisory = ADVISORY_FIELDS.filter((f) => !(f in doc));

      if (missingAdvisory.length > 0) {
        results.push({
          pass: false,
          message: `Missing advisory fields: ${missingAdvisory.join(', ')} (add preview_url to enable visual AI agent previews)`,
          file: filePath,
        });
      } else {
        results.push({
          pass: true,
          message: 'preview_url present',
          file: filePath,
        });
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: 'No .visor.yaml files found',
      });
    }

    return results;
  },
};
