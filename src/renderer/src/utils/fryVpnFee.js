import * as algokit from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment } from '../config/getAlgoClientConfigs'

const FVPN_ASA_ID = 2485198745n // fVPN token
const MIN_PAYMENT_GB = 1n // Minimum 1 GB per session

export async function payNodeForSession(seedPhrase, walletAddress, nodeAddress, pricePerGb, sessionDurationGb = 1n) {
  try {
    const amount = pricePerGb * sessionDurationGb

    console.log('💰 Initiating fVPN payment to node')
    console.log('🎯 Node address:', nodeAddress)
    console.log('💵 Price per GB:', pricePerGb.toString())
    console.log('📊 Session GB:', sessionDurationGb.toString())
    console.log('💰 Total amount:', amount.toString())

    // Configure AlgoKit
    algokit.Config.configure({ populateAppCallResources: true })
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const algorandClient = algokit.AlgorandClient.fromConfig({ algodConfig })
    const wallet = algorandClient.account.fromMnemonic(seedPhrase)

    console.log('🔗 From wallet:', wallet.addr)
    console.log('🔗 To node:', nodeAddress)

    // Check if node has opted in to fVPN token
    try {
      console.log('🔍 Checking if node has opted-in to fVPN token...')
      const nodeInfo = await algorandClient.account.getInformation(nodeAddress)
      const assets = nodeInfo.account?.assets || []
      const hasFvpn = assets.some((asset) => asset['asset-id'] === Number(FVPN_ASA_ID))

      if (!hasFvpn) {
        console.warn('⚠️ Node has not opted-in to fVPN token')
        console.warn('⚠️ Node address:', nodeAddress)
        console.warn('⚠️ Proceeding with transfer attempt anyway...')
      } else {
        console.log('✅ Node has opted-in to fVPN token')
      }
    } catch (checkError) {
      console.warn('⚠️ Could not verify node opt-in status:', checkError.message)
      console.warn('⚠️ Proceeding with transfer attempt anyway...')
    }

    // Send fVPN tokens to node
    const response = await algorandClient.send.assetTransfer({
      assetId: FVPN_ASA_ID,
      receiver: nodeAddress,
      sender: wallet.addr,
      signer: wallet.signer,
      amount: Number(amount), // Convert BigInt to number
    })

    console.log('💸 Transfer response:', response)

    if (response.confirmation) {
      console.log('✅ fVPN payment successful')

      // Extract transaction ID
      let transactionId = response.confirmation.txID || response.txId || response.confirmation.transactionId

      if (!transactionId) {
        console.warn('⚠️ Could not extract transaction ID from response')
        transactionId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      console.log('📝 Transaction ID:', transactionId)

      return {
        success: true,
        message: 'fVPN payment completed successfully',
        txId: transactionId,
        amount: amount.toString(),
        nodeAddress,
      }
    } else {
      console.error('❌ fVPN payment failed')
      return { success: false, message: 'fVPN payment failed!' }
    }
  } catch (error) {
    console.error('❌ fVPN payment error:', error)
    console.error('❌ Error stack:', error.stack)

    // Check if this is an opt-in related error
    if (error.message && (error.message.includes('must optin') || error.message.includes('not opted in'))) {
      console.log('🔍 Detected opt-in error. Node needs to opt into fVPN token.')
      return {
        success: false,
        message: `Payment failed: Node (${nodeAddress}) needs to opt-in to fVPN tokens (ID: ${FVPN_ASA_ID}). Transfer skipped.`,
        skipped: true,
        reason: 'node_not_opted_in',
      }
    }

    // Check if this is a network error
    if (error.message && error.message.includes('Network request error')) {
      return {
        success: false,
        message: 'Payment failed: Network error occurred. Please check your internet connection and try again.',
        skipped: true,
        reason: 'network_error',
      }
    }

    // Check if insufficient funds
    if (error.message && error.message.includes('overspend')) {
      return {
        success: false,
        message: `Payment failed: Insufficient fVPN tokens. Required: ${MIN_PAYMENT_GB} GB worth.`,
        skipped: true,
        reason: 'insufficient_funds',
      }
    }

    return { success: false, message: 'Payment failed: ' + error.message }
  }
}
