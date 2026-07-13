// Validates that the NodeRegistry box ABI decode used by nodeDiscovery.js works
// with the installed algosdk (v3). Run: node scripts/test_node_decode.mjs
import algosdk from 'algosdk'
import assert from 'node:assert'

const TYPE = '(byte[32],string,string,uint32,uint64,uint64,uint64,uint32,uint8,uint64)'
const t = algosdk.ABIType.from(TYPE)

const wg = new Uint8Array(32)
for (let i = 0; i < 32; i++) wg[i] = i

// (wg_pubkey, endpoint, region, capacity_mbps, price_per_gb, last_heartbeat,
//  cumulative_bytes, active_sessions, status, mbr_paid)
const sample = [wg, '203.0.113.7:51820', 'us-east', 100, 1000000n, 50n, 1500000000n, 3, 1, 200000n]

const encoded = t.encode(sample)
const decoded = t.decode(encoded)

assert(Array.isArray(decoded) && decoded.length === 10, 'decoded tuple must have 10 fields')

function bytesToBase64(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes)
  let binary = ''
  for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i])
  return Buffer.from(binary, 'binary').toString('base64')
}

const rec = {
  wg_pubkey: bytesToBase64(decoded[0]),
  endpoint: decoded[1],
  region: decoded[2],
  capacity_mbps: Number(decoded[3]),
  price_per_gb: BigInt(decoded[4]),
  last_heartbeat: BigInt(decoded[5]),
  cumulative_bytes: BigInt(decoded[6]),
  active_sessions: Number(decoded[7]),
  status: Number(decoded[8]),
  mbr_paid: BigInt(decoded[9]),
}

assert.strictEqual(rec.endpoint, '203.0.113.7:51820', 'endpoint')
assert.strictEqual(rec.region, 'us-east', 'region')
assert.strictEqual(rec.capacity_mbps, 100, 'capacity')
assert.strictEqual(rec.price_per_gb, 1000000n, 'price')
assert.strictEqual(rec.last_heartbeat, 50n, 'heartbeat')
assert.strictEqual(rec.active_sessions, 3, 'sessions')
assert.strictEqual(rec.status, 1, 'status')
assert.strictEqual(rec.wg_pubkey, bytesToBase64(wg), 'wg_pubkey roundtrip')
// address <-> box-key roundtrip (box key is the 32-byte pubkey)
const addr = algosdk.encodeAddress(wg)
assert.strictEqual(algosdk.decodeAddress(addr).publicKey.length, 32, 'address decode')

console.log('NODE DISCOVERY DECODE OK:', JSON.stringify({ ...rec, price_per_gb: rec.price_per_gb.toString(), last_heartbeat: rec.last_heartbeat.toString(), cumulative_bytes: rec.cumulative_bytes.toString(), mbr_paid: rec.mbr_paid.toString() }))
