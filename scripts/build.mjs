import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

// Only this generated directory is replaced; source and repository metadata are untouched.
const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
// src/ is the public site tree, including album manifests and optional photos/.
await cp(new URL('../src/', import.meta.url), output, { recursive: true,
  filter: source => !source.split(/[\\/]/).some(part => part.startsWith('.')) });
await writeFile(new URL('.nojekyll', output), '');
console.log('Static site built in dist/. No upload or deployment performed.');
