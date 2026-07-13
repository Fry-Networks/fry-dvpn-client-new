import { Link } from 'react-router-dom';
import { plans } from '../../constants';
import { useSelector } from 'react-redux';
import { selectDarkMode } from '../../store/darkModeSlice';
import { getAccount } from '../../store/accountSlice';
import { useState, useEffect } from 'react';

const UpgradePlan = () => {
  const darkMode = useSelector(selectDarkMode);
  const account = useSelector(getAccount);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [fVpnPrice, setFVpnPrice] = useState(null);

  useEffect(() => {
    // Fetch fVPN price from Vestige API
    async function fetchFVpnPrice() {
      try {
        const response = await fetch('https://api.vestigelabs.org/assets/price?asset_ids=2485198745&network_id=0&denominating_asset_id=0');
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setFVpnPrice(data[0].price);
        }
      } catch (e) {
        setFVpnPrice(null);
      }
    }
    fetchFVpnPrice();
  }, []);

  // Check if user has an active plan
  const hasActivePlan = account?.currentPlan && account?.planExpiryDate && new Date(account.planExpiryDate) > new Date();

  // Get current plan details
  const getCurrentPlanDetails = () => {
    return plans.find(plan => plan.planId === account.currentPlan);
  };

  // Get valid upgrade options based on current plan
  const getValidUpgradeOptions = () => {
    if (!hasActivePlan) {
      return plans; // Show all plans if no active plan
    }

    const currentPlan = getCurrentPlanDetails();
    if (!currentPlan) return plans;

    // Define plan hierarchy (higher index = higher tier)
    const planHierarchy = ['basic', 'premium', 'pro'];
    const currentPlanIndex = planHierarchy.indexOf(account.currentPlan);

    // Only show plans that are higher tier than current plan
    return plans.filter(plan => {
      const planIndex = planHierarchy.indexOf(plan.planId);
      return planIndex > currentPlanIndex;
    });
  };

  // Calculate remaining days
  const getRemainingDays = () => {
    if (!account.planExpiryDate) return 0;
    const expiryDate = new Date(account.planExpiryDate);
    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleSubscription = async (plan) => {
    try {
      setIsProcessing(true);
      setProcessingStep('Processing payment...');
      
      console.log('=== UPGRADE PLAN PROCESS ===');
      console.log('Selected plan:', plan);
      console.log('Current plan:', account.currentPlan);
      console.log('Remaining days:', getRemainingDays());
      
      if (!hasActivePlan) {
        // New subscription - pay the full price in fVPN. Note: the primary
        // decentralized flow is per-session node payment (Connect); optional
        // subscription plans pay a configurable recipient (VITE_FEE_WALLET).
        console.log('New subscription - paying full price:', plan.price, 'fVPN');
        setProcessingStep('Checking balance...');
        if (!window.wgAPI?.getFryBalance || !window.wgAPI?.transferFry) {
          alert('Error: fVPN payment is not available in this build');
          setIsProcessing(false);
          setProcessingStep('');
          return;
        }
        const balanceResult = await window.wgAPI.getFryBalance({ seedPhrase: account.seedPhrase });
        if (!balanceResult.success) {
          alert(`Error checking balance: ${balanceResult.message}`);
          setIsProcessing(false);
          setProcessingStep('');
          return;
        }
        const currentBalance = balanceResult.balance / 1000000;
        if (currentBalance < plan.price) {
          alert(`Insufficient fVPN. You have ${currentBalance.toFixed(6)}, but need ${plan.price}.`);
          setIsProcessing(false);
          setProcessingStep('');
          return;
        }
        setProcessingStep('Processing payment...');
        const transferResult = await window.wgAPI.transferFry({
          seedPhrase: account.seedPhrase,
          amount: plan.price * 1000000,
        });
        if (!transferResult.success) {
          alert(`Payment failed: ${transferResult.message}`);
          setIsProcessing(false);
          setProcessingStep('');
          return;
        }
        setProcessingStep('Activating subscription...');
        if (window.dbAPI?.storeFryTransaction) {
          await window.dbAPI.storeFryTransaction({
            walletAddress: account.walletAddress,
            amount: plan.price,
            transactionId: transferResult.txId,
            timestamp: new Date().toISOString(),
            type: 'subscription_new',
            status: 'completed',
            planDetails: { planId: plan.planId, planName: plan.name, planPrice: plan.price },
          });
        }
        let expiry = null;
        if (window.dbAPI?.updateWalletPlan) {
          const updateResult = await window.dbAPI.updateWalletPlan(account.walletAddress, plan.planId);
          expiry = updateResult?.planExpiryDate || null;
        }
        if (!expiry) {
          // local-first: default 30-day expiry when no database is configured
          expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }
        if (window.store?.dispatch) {
          const { updatePlan } = await import('../../store/accountSlice');
          window.store.dispatch(updatePlan({ currentPlan: plan.planId, planExpiryDate: expiry }));
        }
        alert(`Subscription "${plan.name}" activated. Tx: ${transferResult.txId}`);
        setIsProcessing(false);
        setProcessingStep('');
        return;
      }

      // Upgrade scenario - calculate proration
      const currentPlan = getCurrentPlanDetails();
      const remainingDays = getRemainingDays();
      const totalDaysInMonth = 30; // Assuming 30-day billing cycle
      
      // If user has full remaining days (30), they pay full difference
      // If user has partial days, calculate proration
      let upgradeCost;
      let currentPlanValue;
      let newPlanValue;
      
      if (remainingDays >= totalDaysInMonth) {
        // Full period remaining - pay full difference
        upgradeCost = plan.price - currentPlan.price;
        currentPlanValue = currentPlan.price;
        newPlanValue = plan.price;
        console.log('=== FULL PERIOD UPGRADE ===');
        console.log('Full period remaining - paying full difference');
      } else {
        // Partial period - calculate proration
        const unusedRatio = remainingDays / totalDaysInMonth;
        currentPlanValue = currentPlan.price * unusedRatio;
        newPlanValue = plan.price * unusedRatio;
        upgradeCost = newPlanValue - currentPlanValue;
        console.log('=== PRORATION CALCULATION ===');
        console.log('Partial period - calculating proration');
      }
      
      console.log('Current plan:', currentPlan.name, `(${currentPlan.price} FRY)`);
      console.log('New plan:', plan.name, `(${plan.price} FRY)`);
      console.log('Remaining days:', remainingDays);
      console.log('Upgrade cost:', upgradeCost.toFixed(2), 'FRY');

      // Show upgrade confirmation with proration details
      const confirmMessage = `
Upgrade from ${currentPlan.name} to ${plan.name}

📅 Remaining days: ${remainingDays} days
💰 Current plan value: ${currentPlanValue.toFixed(2)} FRY
💳 New plan value: ${newPlanValue.toFixed(2)} FRY
💸 Upgrade cost: ${upgradeCost.toFixed(2)} FRY

Your plan will be upgraded to ${plan.name} and your subscription will continue for ${remainingDays} more days.

Do you want to proceed with this upgrade?
      `;

      const confirmed = confirm(confirmMessage);
      
      if (confirmed) {
        // Implement actual upgrade logic
        console.log('User confirmed upgrade. Processing payment...');
        
        try {
          setProcessingStep('Checking balance...');
          
          // Check if user has enough FRY tokens
          if (!window.wgAPI?.getFryBalance) {
            alert('Error: FRY balance check not available');
            return;
          }
          
          const balanceResult = await window.wgAPI.getFryBalance({ seedPhrase: account.seedPhrase });
          if (!balanceResult.success) {
            alert(`Error checking balance: ${balanceResult.message}`);
            return;
          }
          
          const currentBalance = balanceResult.balance / 1000000; // Convert from micro-FRY to FRY
          const requiredAmount = upgradeCost;
          
          console.log('💰 Balance check:', {
            currentBalance,
            requiredAmount,
            hasEnough: currentBalance >= requiredAmount
          });
          
          if (currentBalance < requiredAmount) {
            alert(`Insufficient FRY tokens. You have ${currentBalance.toFixed(6)} FRY, but need ${requiredAmount.toFixed(2)} FRY for this upgrade.`);
            return;
          }
          
          setProcessingStep('Processing payment...');
          
          // Transfer FRY tokens for upgrade
          if (!window.wgAPI?.transferFry) {
            alert('Error: FRY transfer not available');
            return;
          }
          
          console.log('💸 Starting FRY transfer for upgrade...');
          const transferResult = await window.wgAPI.transferFry({
            seedPhrase: account.seedPhrase,
            amount: upgradeCost * 1000000 // Convert to micro-FRY
          });
          
          if (!transferResult.success) {
            alert(`Payment failed: ${transferResult.message}`);
            return;
          }
          
          console.log('✅ FRY transfer successful:', transferResult);
          
          setProcessingStep('Updating plan...');
          
          // Store transaction in database
          if (window.dbAPI?.storeFryTransaction) {
            console.log('🗄️ Storing upgrade transaction in database...');
            const transactionData = {
              walletAddress: account.walletAddress,
              amount: upgradeCost,
              transactionId: transferResult.txId,
              timestamp: new Date().toISOString(),
              type: 'plan_upgrade',
              status: 'completed',
              isFallbackId: transferResult.txId?.startsWith('fallback_') || false,
              planDetails: {
                fromPlan: currentPlan.planId,
                toPlan: plan.planId,
                upgradeCost: upgradeCost,
                remainingDays: remainingDays
              }
            };
            
            const storeResult = await window.dbAPI.storeFryTransaction(transactionData);
            if (storeResult.success) {
              console.log('✅ Upgrade transaction stored in database');
            } else {
              console.warn('⚠️ Failed to store upgrade transaction in database:', storeResult.message);
            }
          } else {
            console.warn('⚠️ Database API not available for storing upgrade transaction');
          }
          
          // Update user's plan in database
          if (!window.dbAPI?.updateWalletPlan) {
            alert('Error: Database update not available');
            return;
          }
          
          console.log('🗄️ Updating plan in database...');
          const updateResult = await window.dbAPI.updateWalletPlan(account.walletAddress, plan.planId);
          
          if (!updateResult.success) {
            alert(`Payment successful but failed to update plan: ${updateResult.message}`);
            return;
          }
          
          console.log('✅ Database update successful:', updateResult);
          
          // Update Redux store
          if (window.store && window.store.dispatch) {
            console.log('🔄 Updating Redux store...');
            const { updatePlan } = await import('../../store/accountSlice');
            const planUpdateData = {
              currentPlan: plan.planId,
              planExpiryDate: updateResult.planExpiryDate
            };
            window.store.dispatch(updatePlan(planUpdateData));
            console.log('✅ Redux store updated');
          }
          
          setProcessingStep('Complete!');
          
          // Show success message
          alert(`🎉 Upgrade successful!\n\nPlan upgraded to ${plan.name}\nPayment: ${upgradeCost.toFixed(2)} FRY\nTransaction ID: ${transferResult.txId}\n\nYour plan expires on ${new Date(updateResult.planExpiryDate).toLocaleDateString()}`);
          
          // Refresh FRY balance
          if (window.location.pathname.includes('/dashboard')) {
            // Trigger balance refresh if on dashboard
            const event = new CustomEvent('refreshFryBalance');
            window.dispatchEvent(event);
          }
          
        } catch (error) {
          console.error('❌ Upgrade error:', error);
          alert(`Upgrade failed: ${error.message}`);
        } finally {
          setIsProcessing(false);
          setProcessingStep('');
        }
      } else {
        console.log('User cancelled upgrade');
        setIsProcessing(false);
        setProcessingStep('');
      }
      
    } catch (error) {
      console.error('Error processing upgrade:', error);
      alert('Error processing upgrade. Please try again.');
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const validUpgradeOptions = getValidUpgradeOptions();
  const remainingDays = getRemainingDays();
  const currentPlanDetails = getCurrentPlanDetails();

  return (
    <div className={`w-full py-7 px-5 flex flex-col ${darkMode ? "text-white" : "text-black"}`}>
      <div className='w-fit space-y-7'>
        <div className="w-full flex items-center gap-2">
          <Link to="/dashboard/subscription">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 48 48" fill="none">
              <path d="M19.7606 12.5784L11.1806 21.1784C10.4356 21.9279 10.0175 22.9417 10.0175 23.9984C10.0175 25.0552 10.4356 26.069 11.1806 26.8184L19.7606 35.4184C20.1354 35.7909 20.6423 36 21.1706 36C21.699 36 22.2059 35.7909 22.5806 35.4184C22.7681 35.2325 22.9169 35.0113 23.0184 34.7676C23.1199 34.5239 23.1722 34.2624 23.1722 33.9984C23.1722 33.7344 23.1199 33.473 23.0184 33.2293C22.9169 32.9855 22.7681 32.7643 22.5806 32.5784L16.0006 25.9984H38.0006C38.5311 25.9984 39.0398 25.7877 39.4148 25.4126C39.7899 25.0376 40.0006 24.5288 40.0006 23.9984C40.0006 23.468 39.7899 22.9593 39.4148 22.5842C39.0398 22.2091 38.5311 21.9984 38.0006 21.9984H16.0006L22.5806 15.4184C22.9572 15.0445 23.1699 14.5362 23.1717 14.0055C23.1736 13.4748 22.9646 12.965 22.5906 12.5884C22.2167 12.2118 21.7084 11.9992 21.1777 11.9973C20.647 11.9954 20.1372 12.2045 19.7606 12.5784Z" fill="currentColor" />
            </svg>
          </Link>

          <h2 className="font-open-sans text-2xl font-bold">
            {hasActivePlan ? 'Upgrade Your Plan' : 'Choose Any Plan'}
          </h2>
        </div>

        {hasActivePlan ? (
          // Show current plan info and upgrade options
          <div className='w-fit rounded-3xl backdrop-blur-lg px-[33px]'>
            <div className={`mt-[14px] border border-secondary rounded-[26px] ${darkMode ? "bg-[#2b2a2a] text-white" : "bg-[#FFFFFF80] text-black"} backdrop-blur-lg px-10 py-6`}>
              <div className='text-center mb-6'>
                <h3 className={`text-xl font-semibold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                  Current Active Plan
                </h3>
                <p className={`text-2xl font-bold text-secondary mt-2`}>
                  {currentPlanDetails?.name || account.currentPlan}
                </p>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"} mt-1`}>
                  Expires: {new Date(account.planExpiryDate).toLocaleDateString()}
                </p>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"} mt-1`}>
                  Remaining: {remainingDays} days
                </p>
              </div>
              
              <div className='text-center'>
                {validUpgradeOptions.length > 0 ? (
                  <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"} mb-4`}>
                    Want to upgrade to a better plan? Choose from the options below:
                  </p>
                ) : (
                  <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"} mb-4`}>
                    You're already on the highest tier plan! No upgrades available.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {validUpgradeOptions.length > 0 ? (
          <div className='w-fit rounded-3xl backdrop-blur-lg px-[33px]'>
            <div className={`mt-[14px] border border-secondary rounded-[26px] ${darkMode ? "bg-[#2b2a2a] text-white" : "bg-[#FFFFFF80] text-black"} backdrop-blur-lg grid grid-cols-${validUpgradeOptions.length === 1 ? '1' : '2'} px-10 py-6 relative`}>
              {validUpgradeOptions.map((plan, index) => {
              return (
                <div key={index} className='w-full flex justify-center px-6'>
                  <div className={`min-h-[453px] w-[294px] relative ${index === 1 ? 'after:w-0' : 'after:w-[1px]'}  after:content-normal after:h-1/2 after:absolute after:top-1/2 after:-translate-y-1/2 after:right-0 after:bg-separatorV ${index === 1 ? 'bg-[#450001] text-white -translate-y-10 scale-105 shadow-plan' : ''} rounded-[26px] h-full py-5 px-7 flex flex-col gap-4`}>
                    {index === 1 && (
                      <div className='w-full flex justify-end'>
                        <div className='w-[121px] h-[27px] flex items-center justify-center rounded-full bg-secondary text-white tracking-[0.833px] text-xs font-open-sans font-bold'>
                          MOST POPULAR
                        </div>
                      </div>
                    )}

                    <p className={`text-lg ${index === 1 ? 'text-white' : `${darkMode ? " text-[#f2f0ff]" : "text-[#848199]"}`} font-open-sans`}>
                      <span className={`text-4xl ${index === 1 ? 'text-white' : 'text-secondary'}  font-bold`}>
                        {fVpnPrice !== null ? (
                          <>
                            ${(plan.price * fVpnPrice).toFixed(2)} <span style={{fontSize:'1rem',marginLeft:4}}>USD</span>
                            <span className="block text-xs font-normal mt-1" style={{fontSize:'0.9rem',color:index===1?'#fff':darkMode?'#f2f0ff':'#848199'}}>
                              {plan.price} FRY/{plan.duration}
                            </span>
                          </>
                        ) : (
                          <>
                            {plan.price} FRY/{plan.duration}
                          </>
                        )}
                      </span>
                    </p>

                    <h2 className={`text-[28px] ${index === 1 ? 'text-white' : darkMode ? " text-[#b0aae0]" : "text-[#231D4F]"}`}>{plan.name}</h2>

                    <p className={`text-[15px] ${index === 1 ? 'text-white' : `${darkMode ? " text-[#f2f0ff]" : "text-[#848199]"}`} font-open-sans`}>{plan.description}</p>

                    <ul className="space-y-3 flex-grow">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className={`flex gap-2 items-center text-[15px] ${index === 1 ? 'text-white' : `${darkMode ? " text-[#f2f0ff]" : "text-[#848199]"}`} font-open-sans`}>
                          {index === 1 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20C15.5228 20 20 15.5228 20 10C19.9936 4.47982 15.5202 0.00642897 10 0Z" fill="white" />
                              <path d="M15.7725 6.83313L10.0684 14.574C9.93234 14.7545 9.72948 14.8727 9.50539 14.9022C9.2813 14.9316 9.05478 14.8698 8.87671 14.7306L4.80338 11.474C4.44393 11.1863 4.38573 10.6617 4.67338 10.3023C4.96102 9.94285 5.4856 9.88465 5.84504 10.1723L9.24171 12.8898L14.4309 5.8473C14.601 5.59195 14.8978 5.45078 15.2032 5.47983C15.5087 5.50887 15.7735 5.70344 15.8925 5.98627C16.0115 6.26911 15.9654 6.59445 15.7725 6.83313Z" fill="black" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20C15.5228 20 20 15.5228 20 10C19.9936 4.47982 15.5202 0.00642897 10 0Z" fill="#450001" />
                              <path d="M15.7725 6.83313L10.0683 14.574C9.93228 14.7545 9.72942 14.8727 9.50533 14.9022C9.28124 14.9316 9.05472 14.8698 8.87665 14.7306L4.80331 11.474C4.44387 11.1863 4.38573 10.6617 4.67331 10.3023C4.96096 9.94285 5.48554 9.88465 5.84498 10.1723L9.24165 12.8898L14.4308 5.8473C14.601 5.59195 14.8977 5.45078 15.2032 5.47983C15.5086 5.50887 15.7734 5.70344 15.8924 5.98627C16.0114 6.26911 15.9653 6.59445 15.7725 6.83313Z" fill="white" />
                            </svg>
                          )}

                          {feature.text}
                        </li>
                      ))}
                    </ul>

                    <button 
                      className={`w-full rounded-full text-center mt-[13px] border transition-all duration-200 font-open-sans font-semibold py-3 px-9 ${index === 1 ? 'bg-white text-black border-none' : 'bg-white text-secondary border-secondary'} shadow-tabs ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`} 
                      onClick={() => handleSubscription(plan)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {processingStep || 'Processing...'}
                        </div>
                      ) : (
                        hasActivePlan ? 'Upgrade to This Plan' : 'Choose Plan'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        ) : hasActivePlan ? (
          <div className='w-fit rounded-3xl backdrop-blur-lg px-[33px]'>
            <div className={`mt-[14px] border border-secondary rounded-[26px] ${darkMode ? "bg-[#2b2a2a] text-white" : "bg-[#FFFFFF80] text-black"} backdrop-blur-lg px-10 py-6`}>
              <div className='text-center'>
                <h3 className={`text-xl font-semibold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                  No Upgrades Available
                </h3>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"} mt-2`}>
                  You're already on the highest tier plan. Enjoy all premium features!
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default UpgradePlan;
