#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { main } from '../src/cli.js';
export { filterChoices, initiallySelectedIds } from '../src/agent-selection.js';

const invokedPath = process.argv[1] ? fs.realpathSync.native(path.resolve(process.argv[1])) : undefined;
if (invokedPath === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(`kflow: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
