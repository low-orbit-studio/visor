import { execFileSync } from 'node:child_process';
import type { Rule, RuleResult } from './types.js';

// VI-842, ruling [external/no-client-photos-public]: Honcho's Campout photos, and shots of the
// photo looks, never enter this public repo. Reads git's tracked files, not the disk, so the
// gitignored private photos on a local checkout do not trip it.
const DIRS = ['docs/audits', 'packages/docs/public'];
const PHOTO_IMAGE = /photo.*\.(png|jpe?g|webp)$/i;

/** Pure check, so it can be tested without git. `paths` are repo-relative. */
export function findClientPhotos(paths: string[]): RuleResult[] {
  return paths
    .filter((p) => DIRS.some((d) => p.startsWith(`${d}/`)) && PHOTO_IMAGE.test(p))
    .map((file) => ({ pass: false, message: 'Photo image in the public repo; keep it on the Review Station or in .lo/', file }));
}

export const noClientPhotosPublic: Rule = {
  name: 'no-client-photos-public',
  description: 'No photo or photo-look image is tracked under docs/audits/ or packages/docs/public/',
  category: 'structure',
  async run() {
    const paths = execFileSync('git', ['ls-files', '--', ...DIRS], { encoding: 'utf-8' }).split('\n').filter(Boolean);
    const failures = findClientPhotos(paths);
    return failures.length > 0
      ? failures
      : [{ pass: true, message: `${paths.length} tracked files checked, no photo images` }];
  },
};
