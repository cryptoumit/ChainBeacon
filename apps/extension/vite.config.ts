import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
function manifestPlugin(target: 'chrome' | 'firefox'): Plugin {
  return {
    name: 'copy-extension-manifest',
    closeBundle() {
      const out = path.resolve(root, `../../dist/${target}`);
      mkdirSync(out, { recursive: true });
      copyFileSync(
        path.join(root, `manifests/${target}.json`),
        path.join(out, 'manifest.json'),
      );
    },
  };
}
const target =
  process.env.EXTENSION_TARGET === 'firefox' ? 'firefox' : 'chrome';
export default defineConfig({
  root,
  base: './',
  plugins: [react(), manifestPlugin(target)],
  publicDir: path.join(root, 'public'),
  build: {
    outDir: `../../dist/${target}`,
    emptyOutDir: true,
    rollupOptions: { input: path.join(root, 'popup.html') },
  },
});
