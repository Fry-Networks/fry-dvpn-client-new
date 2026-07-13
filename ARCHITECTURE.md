# Fry dVPN — Consumer Client Architecture

The consumer client is a standalone Electron/React desktop app. It is one half of
the Fry dVPN; the miner/node side and the on-chain coordination layer are documented
in the `fry-dvpn-server-new` repo's `ARCHITECTURE.md`. This file describes only the
client and how it talks to the decentralized network — **no central server**.

## Decentralization changes vs the Octaloop delivery

The delivered client hardcoded a single server `http://54.211.138.164:8000/create-peer`,
showed simulated bandwidth, paid in the wrong token (FRY2), and embedded secrets. The
rebuild removes all of that:

1. **On-chain discovery** (`src/renderer/src/utils/nodeDiscovery.js`)
   - Reads NodeRegistry app boxes from a public Algorand algod/indexer.
   - Returns the live node list: `{address, wg_pubkey, endpoint, region, price_per_gb, active_sessions, last_heartbeat}`.
   - No central API — discovery survives any single host going down.

2. **Selection + failover** (`src/renderer/src/hooks/useNodeSelection.js`, `store/connectionSlice.js`)
   - Ranks nodes by: region preference → measured WireGuard handshake latency → load (`active_sessions`) → price.
   - Skips stale nodes (`current_round - last_heartbeat > STALE_ROUNDS`).
   - On handshake timeout or the connected node going stale, auto-reconnects to the next-best node.

3. **WireGuard main process** (`src/main/index.js`)
   - Generates a per-connection client keypair locally.
   - Opens a session with the selected node's provisioning API (wallet-signature challenge + fVPN payment proof), receives the peer config, brings up the tunnel to the node's published `endpoint`.
   - No hardcoded server address.

4. **Payments in fVPN** (`src/renderer/src/utils/{buyPlan,fryVpnFee,sendFryTokens}.js`)
   - fVPN = ASA `2485198745` (6 decimals). Session `axfer` to the selected node; opt-in handled.
   - No hardcoded recipient wallets, no embedded mnemonic.

5. **Real bandwidth metrics** (`src/renderer/src/components/BandwidthUsage.jsx` + IPC)
   - Surfaces actual WireGuard interface transfer counters instead of random data.

6. **Local-first storage**
   - Wallet/session in a local encrypted store; MongoDB is optional and off by default.
   - No secrets in `.env.example`.

7. **Electron hardening**
   - `webSecurity: true`, `contextIsolation: true`, a Content-Security-Policy, and IPC surface minimized to named channels.

## Trust model

The client trusts: the Algorand chain (for the node registry + payment receipts) and
the WireGuard cryptography of the tunnel. It does **not** trust any Fry-operated API,
because there isn't one in the connection path.
