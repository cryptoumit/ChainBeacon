# ChainBeacon

**Blockchain intelligence for customer support teams.**

ChainBeacon is a lightweight Chrome extension popup for identifying common blockchain addresses and transaction IDs, then opening the relevant block explorer. Lookups run locally in the extension; the only navigation to a third party happens when an agent chooses an explorer link.

## Supported lookups

| Network    | Addresses                                                | Transactions                             |
| ---------- | -------------------------------------------------------- | ---------------------------------------- |
| Bitcoin    | Mainnet Base58Check and Bech32/Bech32m                   | 64-character hexadecimal transaction IDs |
| Ethereum   | EIP-55 checksummed or all-lower/all-upper `0x` addresses | `0x`-prefixed 32-byte hashes             |
| XRP Ledger | Mainnet classic Base58Check addresses                    | 64-character hexadecimal hashes          |
| TRON       | Mainnet Base58Check addresses                            | 64-character hexadecimal transaction IDs |
| Solana     | Base58 public keys                                       | Base58 64-byte signatures                |

Unprefixed 64-character hexadecimal hashes are intentionally listed as Bitcoin, XRP Ledger, or TRON candidates rather than guessed. The agent can choose the correct explorer. Explorer links use each network's public mainnet explorer.

Address formats are validated locally, including Base58Check, Bitcoin SegWit checksums, and Ethereum mixed-case checksums. Solana public keys and signatures are classified by their Base58-decoded byte length; this confirms the encoding length, not that an account or transaction exists on-chain.

## Requirements

- Node.js 24.22.3 (see `.nvmrc`)
- npm 11.19.1
- Google Chrome (for loading the unpacked extension)

## Environment setup and development

```sh
nvm install
nvm use
npm install --global npm@11.19.1
npm ci
npm run dev
```

`package.json` pins the expected Node.js range and npm package manager version. `npm ci` installs exactly the dependency tree recorded in `package-lock.json`; use it for clean and repeatable installs. `npm run dev` starts the Vite development server for UI work. Chrome loads the built extension from `dist`, so use the production build when testing the extension popup.

## Checks and production build

```sh
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
npm ls
npm audit --omit=dev
npm audit
```

The build type-checks the TypeScript sources and creates a loadable extension in `dist/`. `npm run preview` can serve the built popup for a quick browser preview; it does not emulate Chrome extension APIs.

## Load in Chrome

1. Run `npm ci` and `npm run build`.
2. Visit `chrome://extensions`.
3. Turn on **Developer mode**.
4. Select **Load unpacked** and choose this project's `dist` directory.
5. Pin ChainBeacon from the Extensions menu to keep it available in the toolbar.

After changing source files, rebuild and use the extension card's reload button to load the updated extension.

## Project structure

```text
public/manifest.json       Manifest V3 configuration
public/icons/             Extension listing and toolbar icons
popup.html                 Popup page entry
src/App.tsx                Popup interface
src/domain/detection.ts    Address/hash recognition and validation
src/domain/explorers.ts    Chain labels and explorer URL generation
src/domain/detection.test.ts
vite.config.ts             Vite and Vitest configuration
tsconfig.json              Strict TypeScript configuration
```

## Limitations

- Only mainnet formats and explorer links are included; there is no network selector or custom explorer configuration.
- Some hash formats are shared across networks and cannot be identified from the hash alone.
- Solana address/signature checks validate Base58 byte length, not on-chain existence.
- The extension does not query RPC endpoints, balances, transaction status, or external APIs.
- Explorer availability and URL behavior are controlled by their respective providers.
