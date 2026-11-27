# ChainBeacon

**Find the right chain, faster.** ChainBeacon locally recognizes supported blockchain addresses and transaction hashes, then offers links to public mainnet explorers. It ships as a responsive website and as Chrome and Firefox extensions.

## Products

- **Web app:** [cryptoumit.github.io/ChainBeacon](https://cryptoumit.github.io/ChainBeacon/)
- **Chrome extension:** compact Manifest V3 popup, loadable unpacked from `dist/chrome`.
- **Firefox extension:** separate Manifest V3 package, loadable temporarily from `dist/firefox`.

## Supported lookups

| Network         | Addresses                                                | Transactions                             |
| --------------- | -------------------------------------------------------- | ---------------------------------------- |
| Bitcoin Network | Mainnet Base58Check and Bech32/Bech32m                   | 64-character hexadecimal transaction IDs |
| ETH/EVM         | EIP-55 checksummed or all-lower/all-upper `0x` addresses | `0x`-prefixed 32-byte hashes             |
| XRP Ledger      | Mainnet classic Base58Check addresses                    | 64-character hexadecimal hashes          |
| TRON            | Mainnet Base58Check addresses                            | 64-character hexadecimal transaction IDs |
| Solana          | Base58 public keys                                       | Base58 64-byte signatures                |
| Stellar         | Mainnet public account IDs (`G...` StrKeys)              | 64-character hexadecimal transaction IDs |

Format recognition does not prove that an address or transaction exists on-chain. Solana checks the Base58 decoded byte length only. Stellar secret seeds are rejected; muxed accounts and memo IDs are not supported. Unprefixed 64-character hexadecimal hashes can belong to Bitcoin, XRP Ledger, TRON or Stellar; all candidate explorers are shown rather than guessing.

## Privacy

All address and transaction format checks run locally in the browser. Entered lookup values are never sent to a server. The optional Bitcoin block/fee and Ethereum block/gas status cards fetch public network data from Blockstream and Nodely; these requests do not contain lookup values. EVM format recognition cannot identify a specific network, so EVM results link to Blockscan's multichain explorer. Explorer navigation occurs only when a user chooses an explorer link. The extensions request host access only to those two data providers. ChainBeacon includes no analytics.

## Architecture

```text
apps/
  web/                 Standalone responsive GitHub Pages app
  extension/           Shared popup and Chrome/Firefox manifests
packages/
  core/                Local recognition, validation, metadata and explorer URLs
  ui/                  Reusable React components and shared design tokens/styles
dist/
  web/                 Static website
  chrome/              Unpacked Chrome extension
  firefox/             Temporary-install Firefox extension
```

The web and extension apps compose their own page layouts and reuse `@chainbeacon/ui`. That UI calls the browser-independent `@chainbeacon/core` package. Explorer URL generation and chain parsing remain in core.

## Development

Requirements: Node.js `26.13.1` (see `.nvmrc`) and npm `11.19.1`.

```sh
nvm install && nvm use
npm install --global npm@11.19.1
npm ci
npm run dev
```

## Commands

| Command                         | Purpose                                                                   |
| ------------------------------- | ------------------------------------------------------------------------- |
| `npm run dev`                   | Start the web app locally                                                 |
| `npm run dev:web`               | Start the web app locally                                                 |
| `npm run dev:extension`         | Start the extension popup in Vite for UI work                             |
| `npm run build`                 | Run checks, then build all three products                                 |
| `npm run build:web`             | Build GitHub Pages website at `dist/web`                                  |
| `npm run build:chrome`          | Build Chrome extension at `dist/chrome`                                   |
| `npm run build:firefox`         | Build Firefox extension at `dist/firefox`                                 |
| `npm run build:extensions`      | Build both extension packages                                             |
| `npm run version:bump -- patch` | Bump versions, push the commit and tag, and create a draft GitHub Release |
| `npm test`                      | Run core unit tests once                                                  |
| `npm run test:watch`            | Run tests in watch mode                                                   |
| `npm run lint`                  | Run ESLint                                                                |
| `npm run format:check`          | Check Prettier formatting                                                 |
| `npm run typecheck`             | Run strict TypeScript checking                                            |
| `npm run check`                 | Run lint, formatting, type checking and tests                             |

Use `npm run build:web` for the production site and `npm run preview` to preview it. The production web build uses `/ChainBeacon/` as its base path for GitHub Pages. Vite preview does not emulate extension APIs.

## Release a new version

Install and authenticate the GitHub CLI (`gh auth login`) with permission to push to the repository and create releases. Start from a clean working tree on the branch you want to release, then run `npm run version:bump -- patch`, `minor`, or `major`. The command updates all package and extension manifest versions, commits the changes, creates and pushes the matching tag, and opens a draft GitHub Release with generated notes. Review and publish the draft to trigger the extension packaging workflow; that workflow adds the Chrome and Firefox ZIPs and final release notes.

## Load Chrome extension

1. Run `npm ci` and `npm run build:chrome`.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Select **Load unpacked** and choose `dist/chrome`.

## Load Firefox extension

Run `npm run build:firefox`, then open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on…**, and select `dist/firefox/manifest.json`. Temporary add-ons are removed when Firefox closes. The manifest currently uses the placeholder ID `chainbeacon@example.invalid`; replace it with an assigned add-on ID before store submission. The package is configured for Firefox MV3, but this repository’s automated checks do not launch Firefox; verify temporary loading and popup interactions in Firefox before distribution.

## Package extensions

The **Package browser extensions** workflow creates separate ZIP artifacts for Chrome and Firefox when a release is published, or on manual dispatch. It does not publish to browser stores or sign packages. You can also zip the contents of `dist/chrome` or `dist/firefox` locally.

## GitHub Pages deployment

The `Deploy web app to GitHub Pages` workflow runs on pushes to `master` and manual dispatch. In repository **Settings → Pages**, set the deployment source to **GitHub Actions**. The workflow builds only `dist/web` and deploys it at `https://cryptoumit.github.io/ChainBeacon/`.

## Contributing

Install the pinned toolchain, run `npm ci`, then run `npm run check` and `npm run build`. Add recognition, validation and explorer URL tests alongside core code in `packages/core/src`. Keep product layouts in their respective app packages and shared visual elements in `packages/ui`. Do not add remote lookups, telemetry, or network requests involving user-entered values.
