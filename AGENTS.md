# Agent instructions

## Project overview

- ChainBeacon is a Chrome Manifest V3 popup for locally identifying supported blockchain addresses and transaction IDs, then building links to public mainnet explorers.
- The UI is in `src/`; chain recognition and validation live under `src/domain/`. Keep chain-specific parsing and explorer URL generation in the domain layer rather than embedding it in UI components.
- Lookups should remain local. Do not add RPC calls, remote APIs, or transmit user-entered values; navigation to an explorer happens only when the user chooses a link.
- Validate input formats only to the extent the project documents. For example, Solana Base58 byte-length checks do not establish on-chain existence, and shared 64-character hashes can have multiple chain candidates.

## Environment and commands
- Consult `.nvmrc` and `package.json` for the required Node/npm versions and available scripts. Run the relevant checks for your changes.
- To verify extension behavior, build it and load `dist/` in Chrome; Vite preview does not emulate Chrome extension APIs.

## Code and tests
- Follow the existing TypeScript and React patterns. Put domain tests alongside domain code and update them when changing recognition, validation, or explorer URLs.
- Keep `README.md` accurate when supported networks or documented behavior change.
