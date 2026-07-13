import * as algokit from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment } from '../config/getAlgoClientConfigs'

// DEPRECATED: This module uses the old centralized plan model. For decentralized dVPN, use fryVpnFee.js
// and payNodeForSession() to pay nodes directly per-session.
// FEE_WALLET is now configurable via environment or should be removed in favor of node-based payments
const FEE_WALLET = process.env.VITE_FEE_WALLET || null
const FRY_TOKEN_ID = 2485198745n

// Get all available plans from database
export async function getAllPlans() {
  try {
    if (window.dbAPI && window.dbAPI.getAllPlans) {
      const result = await window.dbAPI.getAllPlans();
      if (result.success) {
        return { success: true, plans: result.plans };
      } else {
        return { success: false, message: result.message };
      }
    } else {
      return { success: false, message: 'Database API not available' };
    }
  } catch (error) {
    console.error('Error getting plans:', error);
    return { success: false, message: 'Failed to get plans: ' + error.message };
  }
}

// Get a specific plan by ID
export async function getPlan(planId) {
  try {
    if (window.dbAPI && window.dbAPI.getPlan) {
      const result = await window.dbAPI.getPlan(planId);
      if (result.success) {
        return { success: true, plan: result.plan };
      } else {
        return { success: false, message: result.message };
      }
    } else {
      return { success: false, message: 'Database API not available' };
    }
  } catch (error) {
    console.error('Error getting plan:', error);
    return { success: false, message: 'Failed to get plan: ' + error.message };
  }
}

// Update wallet plan
export async function updateWalletPlan(walletAddress, planId) {
  try {
    console.log('🔄 updateWalletPlan called with:', { walletAddress, planId });
    
    if (window.dbAPI && window.dbAPI.updateWalletPlan) {
      console.log('✅ dbAPI.updateWalletPlan is available');
      console.log('📞 Calling dbAPI.updateWalletPlan...');
      const result = await window.dbAPI.updateWalletPlan(walletAddress, planId);
      console.log('📞 dbAPI.updateWalletPlan result:', result);
      
      if (result.success) {
        console.log('✅ updateWalletPlan successful:', result);
        return { 
          success: true, 
          message: 'Plan updated successfully!',
          plan: result.plan,
          planExpiryDate: result.planExpiryDate
        };
      } else {
        console.error('❌ updateWalletPlan failed:', result.message);
        return { success: false, message: result.message };
      }
    } else {
      console.error('❌ dbAPI.updateWalletPlan not available');
      console.log('window.dbAPI:', window.dbAPI);
      return { success: false, message: 'Database API not available' };
    }
  } catch (error) {
    console.error('❌ Error in updateWalletPlan:', error);
    console.error('❌ Error stack:', error.stack);
    return { success: false, message: 'Failed to update plan: ' + error.message };
  }
}

// Buy plan with FRY token transfer and plan update
async function buyPlan(data) {
  try {
    console.log('🚀 buyPlan function called with data:', data);
    
    // Get account from Redux store for comparison
    let currentAccount = null;
    if (window.store && window.store.getState) {
      currentAccount = window.store.getState().account;
    }
    
    // First, get the plan details
    console.log('📋 Getting plan details for planId:', data.planId);
    const planResult = await getPlan(data.planId);
    console.log('📋 Plan lookup result:', planResult);
    
    if (!planResult.success) {
      console.error('❌ Plan not found:', planResult.message);
      return { success: false, message: 'Plan not found: ' + planResult.message };
    }

    const plan = planResult.plan;
    console.log('✅ Plan found:', plan);

    // Check if user has enough FRY tokens
    if (window.wgAPI && window.wgAPI.getFryBalance) {
      console.log('💰 Checking FRY balance...');
      const balanceResult = await window.wgAPI.getFryBalance({ seedPhrase: data.seedPhrase });
      console.log('💰 Balance check result:', balanceResult);
      
      if (!balanceResult.success) {
        console.error('❌ Failed to check balance:', balanceResult.message);
        return { success: false, message: 'Failed to check balance: ' + balanceResult.message };
      }

      const requiredAmount = plan.price * 1000000;
      console.log('💰 Required amount (micro-FRY):', requiredAmount);
      console.log('💰 Current balance (micro-FRY):', balanceResult.balance);
      
      if (balanceResult.balance < requiredAmount) {
        console.error('❌ Insufficient balance');
        return { 
          success: false, 
          message: `Insufficient FRY tokens. You have ${balanceResult.balance / 1000000} FRY, but need ${plan.price} FRY for this plan.` 
        };
      }
    }

    // Transfer FRY tokens to fee wallet
    console.log('💸 Starting FRY transfer...');
    algokit.Config.configure({ populateAppCallResources: true })
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const algorandClient = algokit.AlgorandClient.fromConfig({ algodConfig })
    let wallet = algorandClient.account.fromMnemonic(data.seedPhrase)

    console.log('💸 Transferring FRY tokens for plan purchase...');
    console.log('💸 From wallet:', wallet.addr);
    console.log('💸 To fee wallet:', FEE_WALLET);
    console.log('💸 Amount:', plan.price * 1000000, 'micro-FRY');
    
    // Check if fee wallet has opted-in to FRY token
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
      amount: plan.price * 1000000 // Convert FRY to micro-FRY (6 decimal places)
      // amount: plan.price // Convert FRY to micro-FRY (6 decimal places)
    })

    console.log('💸 Transfer response:', response);

    if (response.confirmation) {
      console.log('✅ FRY transfer successful, updating wallet plan...');
      console.log('📝 Transaction ID:', response.confirmation.transactionId);
      
      // Update wallet plan in database
      const walletAddressString = wallet.addr.toString();
      console.log('🗄️ Calling updateWalletPlan with:', { walletAddress: walletAddressString, planId: plan.planId });
      
      // Debug: Compare wallet addresses
      console.log('🔍 Wallet address comparison:');
      console.log('🔍 Transaction wallet address:', walletAddressString);
      console.log('🔍 Redux store wallet address:', currentAccount?.walletAddress);
      console.log('🔍 Addresses match:', walletAddressString === currentAccount?.walletAddress);
      
      const updateResult = await updateWalletPlan(walletAddressString, plan.planId);
      console.log('🗄️ Database update result:', updateResult);
      
      if (updateResult.success) {
        console.log('✅ Database update successful:', updateResult);
        console.log('📅 Plan expiry date from DB:', updateResult.planExpiryDate);
        
        // Store transaction in database
        if (window.dbAPI && window.dbAPI.storeFryTransaction) {
          console.log('🗄️ Storing plan purchase transaction in database...');
          
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
          
          const transactionData = {
            walletAddress: walletAddressString,
            amount: plan.price,
            transactionId: transactionId,
            timestamp: new Date().toISOString(),
            type: 'plan_purchase',
            status: 'completed',
            isFallbackId: transactionId.startsWith('fallback_'),
            planDetails: {
              planId: plan.planId,
              planName: plan.name,
              planPrice: plan.price,
              planDuration: plan.duration
            }
          };
          
          const storeResult = await window.dbAPI.storeFryTransaction(transactionData);
          if (storeResult.success) {
            console.log('✅ Plan purchase transaction stored in database');
          } else {
            console.warn('⚠️ Failed to store plan purchase transaction in database:', storeResult.message);
          }
        } else {
          console.warn('⚠️ Database API not available for storing plan purchase transaction');
        }
        
        // Update Redux store with new plan information
        if (window.store && window.store.dispatch) {
          console.log('🔄 Dispatching to Redux store...');
          const { updatePlan } = await import('../store/accountSlice');
          const planUpdateData = {
            currentPlan: plan.planId,
            planExpiryDate: updateResult.planExpiryDate
          };
          console.log('📊 Plan update data for Redux:', planUpdateData);
          window.store.dispatch(updatePlan(planUpdateData));
          console.log('✅ Redux dispatch completed');
        } else {
          console.log('⚠️ Redux store not available');
        }
        
        return { 
          success: true, 
          message: `Plan "${plan.name}" purchased successfully! Your plan expires on ${new Date(updateResult.planExpiryDate).toLocaleDateString()}`,
          plan: plan,
          planExpiryDate: updateResult.planExpiryDate,
          txId: response.confirmation.transactionId
        };
      } else {
        console.error('❌ Database update failed:', updateResult.message);
        return { 
          success: false, 
          message: 'Payment successful but failed to update plan: ' + updateResult.message 
        };
      }
    } else {
      console.error('❌ FRY transfer failed');
      return { success: false, message: 'Payment failed!' };
    }
  } catch (e) {
    console.error('❌ Buy plan error:', e);
    console.error('❌ Error stack:', e.stack);
    
    // Check if this is an opt-in related error
    if (e.message && (e.message.includes('must optin') || e.message.includes('not opted in') || e.message.includes('opt-in'))) {
      return { 
        success: false, 
        message: `Payment failed: The receiving wallet (${FEE_WALLET}) needs to opt-in to FRY tokens (ID: ${FRY_TOKEN_ID}). Please contact support to resolve this issue.` 
      };
    }
    
    // Check if this is a network error
    if (e.message && e.message.includes('Network request error')) {
      return { 
        success: false, 
        message: 'Payment failed: Network error occurred. Please check your internet connection and try again.' 
      };
    }
    
    return { success: false, message: 'Plan purchase failed: ' + e.message };
  }
}

// Create a new plan (admin function)
export async function createPlan(planData) {
  try {
    if (window.dbAPI && window.dbAPI.createPlan) {
      const result = await window.dbAPI.createPlan(planData);
      if (result.success) {
        return { success: true, message: 'Plan created successfully!' };
      } else {
        return { success: false, message: result.message };
      }
    } else {
      return { success: false, message: 'Database API not available' };
    }
  } catch (error) {
    console.error('Error creating plan:', error);
    return { success: false, message: 'Failed to create plan: ' + error.message };
  }
}

// Update an existing plan (admin function)
export async function updatePlanInDb(planId, planData) {
  try {
    if (window.dbAPI && window.dbAPI.updatePlan) {
      const result = await window.dbAPI.updatePlan(planId, planData);
      if (result.success) {
        return { success: true, message: 'Plan updated successfully!' };
      } else {
        return { success: false, message: result.message };
      }
    } else {
      return { success: false, message: 'Database API not available' };
    }
  } catch (error) {
    console.error('Error updating plan:', error);
    return { success: false, message: 'Failed to update plan: ' + error.message };
  }
}

// Delete a plan (admin function)
export async function deletePlan(planId) {
  try {
    if (window.dbAPI && window.dbAPI.deletePlan) {
      const result = await window.dbAPI.deletePlan(planId);
      if (result.success) {
        return { success: true, message: 'Plan deleted successfully!' };
      } else {
        return { success: false, message: result.message };
      }
    } else {
      return { success: false, message: 'Database API not available' };
    }
  } catch (error) {
    console.error('Error deleting plan:', error);
    return { success: false, message: 'Failed to delete plan: ' + error.message };
  }
}

export default buyPlan
