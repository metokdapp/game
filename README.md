# METOK RPS DApp — Monad Mainnet

Static, mobile-first DApp for the deployed **METOKRPSV645** contract. No build step and no backend are required.

## Live contract configuration

- Chain: Monad Mainnet (`143` / `0x8f`)
- RPC: `https://rpc.monad.xyz`
- Game: `0xf380df90979Af5BC70e685E58B0F2aa1fe0d8286`
- METOK: `0xE25AaBa9CBCD0DF6e0b3659c66F1C022a4ED1cf6`
- Deployment block: `105247500`
- App version: `6.4.5`

All of these values are isolated in `config.js`.

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload **all files from this ZIP to the repository root** (not the outer folder).
3. Commit to the default branch.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, select **Deploy from a branch**.
6. Select your default branch and `/ (root)`, then save.
7. Open the generated HTTPS Pages URL in an EVM wallet browser or desktop browser with MetaMask/Rabby/Phantom.

HTTPS is required for the PWA/service worker and recommended for wallet usage.

## User flow

1. Connect wallet and switch to Monad.
2. Deposit METOK to the Vault. The DApp approves the exact deposit amount if needed.
3. Create a room (stake + bankroll) or join by Room ID / invite link.
4. Pick Rock/Paper/Scissors. The DApp creates a random 32-byte secret, stores it locally, gets the commitment from the contract and submits the commitment.
5. When the choice timer ends, reveal. The DApp reuses the stored secret.
6. Timeout actions are selected automatically based on the current round state.
7. Withdraw available METOK back to the main wallet.

## Fast Play Session

Fast Play is optional. It creates a fresh EOA in the browser and configures it as the contract's restricted session key.

- The session private key is stored in **sessionStorage only**.
- It is never sent to a backend or analytics service.
- Closing the tab can lose the session private key. The main wallet can still replace or revoke the session.
- The session cannot call wallet-only withdrawal functions, but a compromised session can still cause gameplay economic loss within its configured bankroll/risk limits.
- Keep the risk limit and room bankroll limit intentionally small.

The main wallet can always play directly if Fast Play is disabled or unavailable.

## Commit/reveal secret storage

Round choice secrets are stored in browser `localStorage` so a page refresh does not destroy the reveal preimage. The UI provides a **Backup secret** button while the round is pending. Do not share a secret before the round is settled.

No wallet private key or seed phrase is ever requested by this DApp.

## Governance

The Governance tab is shown only when the connected address is a protocol owner. It supports the contract's four governance areas: add owner, remove owner, fee change and protocol-fee withdrawal, including proposal approval and execution/acceptance.

## Files

- `index.html` — semantic UI shell
- `styles.css` — responsive game UI
- `app.js` — wallet, Vault, lobby, gameplay, session and governance logic
- `config.js` — chain and deployed contract addresses
- `manifest.webmanifest`, `sw.js`, `icon.svg` — installable PWA shell
- `.nojekyll` — GitHub Pages compatibility

## Security notes

- This is a static client. It has no server and no analytics.
- Transactions are simulated/estimated by the wallet/provider before signing when supported by the wallet stack.
- The app uses the deployed V6.4.5 contract API and does not custody player funds.
- Review the contract and frontend independently before directing meaningful public value to the application.
