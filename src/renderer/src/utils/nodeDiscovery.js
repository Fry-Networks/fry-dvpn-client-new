import * as algokit from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import { getAlgodConfigFromViteEnvironment } from '../config/getAlgoClientConfigs'

const STALE_ROUNDS = 640 // Node is stale if not heartbeated within 640 rounds (~1 hour)

export async function discoverNodes() {
  try {
    const registryAppId = import.meta.env.VITE_REGISTRY_APP_ID
    if (!registryAppId) {
      console.error('VITE_REGISTRY_APP_ID not configured')
      return { success: false, message: 'Registry app ID not configured', nodes: [] }
    }

    console.log('🔍 Discovering nodes from registry app:', registryAppId)

    // Configure AlgoKit
    algokit.Config.configure({ populateAppCallResources: true })
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const algorandClient = algokit.AlgorandClient.fromConfig({ algodConfig })

    // Get current round for staleness check (algosdk v3 may return camelCase/bigint)
    const status = await algorandClient.client.algod.status().do()
    const currentRound = Number(
      status.lastRound ?? status['last-round'] ?? status['last-confirmed-block'] ?? 0
    )
    console.log('📊 Current round:', currentRound)

    // Get all boxes for the registry app
    console.log('📦 Fetching registry boxes...')
    const boxesResponse = await algorandClient.client.algod
      .getApplicationBoxes(Number(registryAppId))
      .do()

    const boxNames = boxesResponse.boxes.map((box) => box.name)
    console.log(`📦 Found ${boxNames.length} boxes in registry`)

    const nodes = []

    for (const boxName of boxNames) {
      try {
        // Read box value
        const boxData = await algorandClient.client.algod
          .getApplicationBoxByName(Number(registryAppId), boxName)
          .do()

        const boxValue = boxData.value
        const decoded = decodeNodeBox(boxValue)

        if (!decoded) {
          console.warn('⚠️ Failed to decode box:', boxName)
          continue
        }

        // Check if node is stale (last_heartbeat is a BigInt uint64)
        const roundsSinceHeartbeat = currentRound - Number(decoded.last_heartbeat)
        const isStale = roundsSinceHeartbeat > STALE_ROUNDS
        const isHealthy = decoded.status === 1 && !isStale

        const nodeInfo = {
          address: algosdk.encodeAddress(boxName),
          wgPubkey: decoded.wg_pubkey,
          endpoint: decoded.endpoint,
          region: decoded.region,
          capacityMbps: decoded.capacity_mbps,
          pricePerGb: decoded.price_per_gb,
          lastHeartbeat: decoded.last_heartbeat,
          cumulativeBytes: decoded.cumulative_bytes,
          activeSessions: decoded.active_sessions,
          status: decoded.status,
          mbrPaid: decoded.mbr_paid,
          isStale,
          isHealthy,
          roundsSinceHeartbeat,
        }

        console.log(`✅ Node ${nodeInfo.address}: ${isHealthy ? 'healthy' : 'stale/unhealthy'}`)
        nodes.push(nodeInfo)
      } catch (error) {
        console.warn('⚠️ Error reading box:', error.message)
        continue
      }
    }

    console.log(`✅ Discovered ${nodes.length} nodes (${nodes.filter(n => n.isHealthy).length} healthy)`)
    return { success: true, nodes, currentRound }
  } catch (error) {
    console.error('❌ Node discovery failed:', error)
    return { success: false, message: error.message, nodes: [] }
  }
}

// base64-encode raw bytes without relying on Node's Buffer (renderer-safe).
function bytesToBase64(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes)
  let binary = ''
  for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i])
  return btoa(binary)
}

// ARC4 tuple matching the NodeRegistry NodeRecord struct (order is load-bearing).
const NODE_RECORD_ABI = algosdk.ABIType.from(
  '(byte[32],string,string,uint32,uint64,uint64,uint64,uint32,uint8,uint64)'
)

function decodeNodeBox(boxValue) {
  try {
    const v = NODE_RECORD_ABI.decode(boxValue)
    if (!Array.isArray(v) || v.length < 10) {
      console.warn('⚠️ Invalid box structure')
      return null
    }
    // uint64 fields decode to BigInt; uint32/uint8/byte to Number in algosdk v3.
    return {
      wg_pubkey: bytesToBase64(v[0]),
      endpoint: v[1],
      region: v[2],
      capacity_mbps: Number(v[3]),
      price_per_gb: BigInt(v[4]),
      last_heartbeat: BigInt(v[5]),
      cumulative_bytes: BigInt(v[6]),
      active_sessions: Number(v[7]),
      status: Number(v[8]),
      mbr_paid: BigInt(v[9]),
    }
  } catch (error) {
    console.error('❌ Box decode error:', error)
    return null
  }
}
