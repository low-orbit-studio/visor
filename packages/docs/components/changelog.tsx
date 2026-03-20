import fs from 'fs';
import path from 'path';
import Markdown from 'react-markdown';

export function Changelog() {
  const changelogPath = path.resolve(
    process.cwd(),
    '..',
    'tokens',
    'CHANGELOG.md'
  );

  let content: string;

  try {
    content = fs.readFileSync(changelogPath, 'utf-8');
  } catch {
    content = '*No changelog available yet.*';
  }

  return (
    <div className="changelog">
      <Markdown>{content}</Markdown>
    </div>
  );
}
