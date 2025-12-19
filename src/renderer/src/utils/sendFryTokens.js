import * as algokit from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment } from '../config/getAlgoClientConfigs'

// const FEE_WALLET = 'F3RFSU3VN2HXTIVNXUJ2MQUIVMQNMR33QWDQ5D26TSXZD43FA3DGJJSZJM'
// const FEE_WALLET = '7KSPCJUIGA46TZ7NCOPERMGL6GPOVYWRGZEJRUNWRWPZUNNM3OXAB5AZBY'
const FEE_WALLET = 'E2F2LT2INE75DBOYHQXTCTOP2PAP5MHAXQRXTTCCXFKHQTVG36DJONBQZE'
const FRY_TOKEN_ID = 2485314946n
const PERIODIC_AMOUNT = 0.000005 // 0.000005 FRY tokens per transfer

// Send periodic FRY tokens to fee wallet
export async function sendPeriodicFryTokens(seedPhrase, walletAddress) {
  try {
    console.log('🔄 sendPeriodicFryTokens called');
    console.log('💰 Amount:', PERIODIC_AMOUNT, 'FRY tokens');
    console.log('🎯 To wallet:', FEE_WALLET);
    
    // Configure AlgoKit
    algokit.Config.configure({ populateAppCallResources: true })
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const algorandClient = algokit.AlgorandClient.fromConfig({ algodConfig })
    let wallet = algorandClient.account.fromMnemonic(seedPhrase)

    console.log('💸 Transferring periodic FRY tokens...');
    console.log('💸 From wallet:', wallet.addr);
    console.log('💸 To fee wallet:', FEE_WALLET);
    console.log('💸 Amount:', PERIODIC_AMOUNT * 1000000, 'micro-FRY');
    
    // Check if fee wallet has opted-in to FRY token (same logic as buyPlan.js)
    try {
      console.log('🔍 Checking if fee wallet has opted-in to FRY token...');
      const feeWalletInfo = await algorandClient.account.getInformation(FEE_WALLET);
      console.log('🔍 Fee wallet info:', feeWalletInfo);
      
      // Check if the fee wallet has the FRY token in its assets
      const assets = feeWalletInfo.account?.assets || [];
      const hasFryToken = assets.some(asset => 
        asset['asset-id'] === Number(FRY_TOKEN_ID)
      );
      
      console.log('🔍 Fee wallet assets:', assets);
      console.log('🔍 Looking for FRY token ID:', Number(FRY_TOKEN_ID));
      console.log('🔍 Has FRY token:', hasFryToken);
      
      // If no assets array or empty assets array, assume wallet needs opt-in
      if (!assets || assets.length === 0) {
        console.warn('⚠️ Fee wallet has no assets - assuming needs opt-in');
        console.warn('⚠️ Proceeding with transfer attempt to test opt-in status...');
      } else if (!hasFryToken) {
        console.error('❌ Fee wallet has not opted-in to FRY token');
        console.error('❌ Fee wallet address:', FEE_WALLET);
        console.error('❌ FRY token ID:', FRY_TOKEN_ID);
        console.warn('⚠️ Proceeding with transfer attempt anyway...');
      } else {
        console.log('✅ Fee wallet has opted-in to FRY token');
      }
    } catch (checkError) {
      console.warn('⚠️ Could not verify fee wallet opt-in status:', checkError.message);
      console.warn('⚠️ Fee wallet address:', FEE_WALLET);
      console.warn('⚠️ FRY token ID:', FRY_TOKEN_ID);
      console.warn('⚠️ Proceeding with transfer attempt anyway...');
      // Continue with transfer attempt - the error will be caught below if opt-in is needed
    }
    
    const response = await algorandClient.send.assetTransfer({
      assetId: FRY_TOKEN_ID,
      receiver: FEE_WALLET,
      sender: wallet.addr,
      signer: wallet.signer,
      amount: Math.floor(PERIODIC_AMOUNT * 1000000) // Convert to micro-FRY
    })

    console.log('💸 Transfer response:', response);

    if (response.confirmation) {
      console.log('✅ Periodic FRY transfer successful');
      console.log('📝 Full confirmation object:', response.confirmation);
      
      // Try different ways to get the transaction ID
      let transactionId = null;
      
      // Method 1: Direct property
      if (response.confirmation.transactionId) {
        transactionId = response.confirmation.transactionId;
      }
      // Method 2: From txId property
      else if (response.confirmation.txId) {
        transactionId = response.confirmation.txId;
      }
      // Method 3: From response.txId
      else if (response.txId) {
        transactionId = response.txId;
      }
      // Method 4: From transaction object
      else if (response.transaction && response.transaction.txID) {
        transactionId = response.transaction.txID;
      }
      // Method 5: Generate fallback
      else {
        transactionId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.warn('⚠️ Could not extract transaction ID from response, using fallback');
      }
      
      console.log('📝 Using transaction ID:', transactionId);
      
      // Store transaction in database
      const transactionData = {
        walletAddress: walletAddress,
        amount: PERIODIC_AMOUNT,
        transactionId: transactionId,
        timestamp: new Date().toISOString(),
        type: 'periodic_fee',
        status: 'completed',
        isFallbackId: transactionId.startsWith('fallback_')
      };
      
      console.log('🗄️ Storing transaction in database:', transactionData);
      
      if (window.dbAPI && window.dbAPI.storeFryTransaction) {
        const dbResult = await window.dbAPI.storeFryTransaction(transactionData);
        console.log('🗄️ Database storage result:', dbResult);
        
        if (dbResult.success) {
          console.log('✅ Transaction stored in database successfully');
        } else {
          console.error('❌ Failed to store transaction in database:', dbResult.message);
        }
      } else {
        console.error('❌ Database API not available for storing FRY transactions');
      }
      
      return { 
        success: true, 
        message: `Periodic FRY fee sent successfully!`,
        txId: transactionId,
        amount: PERIODIC_AMOUNT,
        isFallbackId: transactionId.startsWith('fallback_')
      };
    } else {
      console.error('❌ Periodic FRY transfer failed');
      return { success: false, message: 'Periodic FRY transfer failed!' };
    }
  } catch (e) {
    console.error('❌ Periodic FRY transfer error:', e);
    console.error('❌ Error stack:', e.stack);
    
    // Check if this is an opt-in related error (same logic as buyPlan.js)
    if (e.message && (e.message.includes('must optin') || e.message.includes('not opted in') || e.message.includes('opt-in'))) {
      console.log('🔍 Detected opt-in error. Fee wallet needs to opt into FRY token.');
      return { 
        success: false, 
        message: `Periodic FRY transfer failed: The receiving wallet (${FEE_WALLET}) needs to opt-in to FRY tokens (ID: ${FRY_TOKEN_ID}). Transfer skipped.`,
        skipped: true,
        reason: 'fee_wallet_not_opted_in'
      };
    }
    
    // Check if this is a network error
    if (e.message && e.message.includes('Network request error')) {
      return { 
        success: false, 
        message: 'Periodic FRY transfer failed: Network error occurred. Please check your internet connection and try again.',
        skipped: true,
        reason: 'network_error'
      };
    }
    
    return { success: false, message: 'Periodic FRY transfer failed: ' + e.message };
  }
}

// Get FRY transaction history for a wallet
export async function getFryTransactionHistory(walletAddress) {
  try {
    if (window.dbAPI && window.dbAPI.getFryTransactions) {
      const result = await window.dbAPI.getFryTransactions(walletAddress);
      if (result.success) {
        return { success: true, transactions: result.transactions };
      } else {
        return { success: false, message: result.message };
      }
    } else {
      return { success: false, message: 'Database API not available' };
    }
  } catch (error) {
    console.error('Error getting FRY transaction history:', error);
    return { success: false, message: 'Failed to get FRY transaction history: ' + error.message };
  }
}

// Get total FRY fees paid by a wallet
export async function getTotalFryFeesPaid(walletAddress) {
  try {
    if (window.dbAPI && window.dbAPI.getTotalFryFees) {
      const result = await window.dbAPI.getTotalFryFees(walletAddress);
      if (result.success) {
        return { success: true, totalFees: result.totalFees };
      } else {
        return { success: false, message: result.message };
      }
    } else {
      return { success: false, message: 'Database API not available' };
    }
  } catch (error) {
    console.error('Error getting total FRY fees:', error);
    return { success: false, message: 'Failed to get total FRY fees: ' + error.message };
  }
} 