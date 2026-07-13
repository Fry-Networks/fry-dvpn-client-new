import axios from 'axios'

const LATENCY_TIMEOUT_MS = 5000
const HEALTH_CHECK_PATH = '/health'

export async function measureLatency(node) {
  const startTime = Date.now()
  try {
    const url = `http://${node.endpoint}:${node.apiPort || 8088}${HEALTH_CHECK_PATH}`
    await axios.get(url, { timeout: LATENCY_TIMEOUT_MS })
    const latency = Date.now() - startTime
    return { success: true, latency }
  } catch (error) {
    console.warn(`⚠️ Latency check failed for ${node.endpoint}:`, error.message)
    return { success: false, latency: LATENCY_TIMEOUT_MS }
  }
}

export async function selectBestNode(healthyNodes, regionPreference = null) {
  if (!healthyNodes || healthyNodes.length === 0) {
    return null
  }

  console.log(`🔍 Selecting best node from ${healthyNodes.length} candidates`)

  // Step 1: Filter by region if preference given
  let candidates = healthyNodes
  if (regionPreference) {
    const regional = healthyNodes.filter((n) => n.region === regionPreference)
    if (regional.length > 0) {
      console.log(`📍 Filtered to ${regional.length} nodes in region ${regionPreference}`)
      candidates = regional
    } else {
      console.warn(`⚠️ No nodes in region ${regionPreference}, using all`)
    }
  }

  // Step 2: Measure latency for all candidates in parallel
  console.log('⏱️  Measuring latency...')
  const latencyResults = await Promise.all(
    candidates.map(async (node) => {
      const result = await measureLatency(node)
      return { node, ...result }
    })
  )

  // Step 3: Sort by: latency (ascending) → active_sessions (ascending) → price (ascending)
  const sorted = latencyResults.sort((a, b) => {
    // Priority 1: Successful latency check beats timeout
    if (a.success && !b.success) return -1
    if (!a.success && b.success) return 1

    // Priority 2: Lowest latency
    if (a.latency !== b.latency) {
      return a.latency - b.latency
    }

    // Priority 3: Lowest load
    if (a.node.activeSessions !== b.node.activeSessions) {
      return a.node.activeSessions - b.node.activeSessions
    }

    // Priority 4: Lowest price
    return a.node.pricePerGb - b.node.pricePerGb
  })

  const best = sorted[0]
  if (best) {
    const status = best.success ? '✅ REACHABLE' : '⚠️ TIMEOUT'
    console.log(
      `✅ Selected node ${best.node.address} [${best.node.region}] latency=${best.latency}ms load=${best.node.activeSessions} price=${best.node.pricePerGb} ${status}`
    )
    return { ...best.node, measuredLatency: best.latency, latencySuccess: best.success }
  }

  return null
}

export function* withFailover(nodesList) {
  // Generator that yields nodes in priority order for failover
  // Sorts by: latency → load → price, then yields in order
  const sorted = [...nodesList].sort((a, b) => {
    if ((a.measuredLatency || LATENCY_TIMEOUT_MS) !== (b.measuredLatency || LATENCY_TIMEOUT_MS)) {
      return (a.measuredLatency || LATENCY_TIMEOUT_MS) - (b.measuredLatency || LATENCY_TIMEOUT_MS)
    }
    if (a.activeSessions !== b.activeSessions) {
      return a.activeSessions - b.activeSessions
    }
    return a.pricePerGb - b.pricePerGb
  })

  for (const node of sorted) {
    yield node
  }
}
