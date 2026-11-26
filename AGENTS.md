# Agent instructions

## Project overview

- ChainBeacon is an npm-workspaces monorepo containing a standalone web app, Chrome MV3 extension, and Firefox MV3 extension.
- Product layouts live in `apps/web` and `apps/extension`; reusable React components/styles live in `packages/ui`; recognition, validation, network metadata, and explorer URLs live in `packages/core`.
- Keep all entered values local. Never transmit user-entered values or add telemetry/analytics. Existing Bitcoin and Ethereum status cards may fetch public network metrics from Blockstream and Nodely; keep those requests separate from input detection and explorer lookup.
- Format validation does not establish on-chain existence. Solana Base58 byte-length checks do not prove existence, shared 64-character hashes must preserve all supported candidates, and Stellar secret seeds must remain rejected.
- The apps compose independent page layouts but should reuse shared UI and core behavior.

## Environment and commands

- Use Node.js `26.13.1` and npm `11.19.1` as specified by `.nvmrc` and `package.json`.
- `npm run check` runs lint, formatting, TypeScript checking, and unit tests.
- `npm run build` creates web, Chrome, and Firefox products; individual builds are available through `build:web`, `build:chrome`, and `build:firefox`.
- The website targets the GitHub Pages `/ChainBeacon/` repository path. Extension builds must use relative asset URLs.

## Code and tests

- Follow existing strict TypeScript and React patterns. Add core tests beside the domain logic in `packages/core/src`.
- Keep browser-specific behavior out of core. Avoid extension permissions unless required by a documented capability.
- Keep README instructions and supported-network information accurate.
- Do not claim browser loading or deployment has been verified unless it was actually performed.
