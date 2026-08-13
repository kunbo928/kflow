import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { kflow: 'packages/cli/bin/kflow.ts' },
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  clean: true,
  dts: false,
});
