import { useNavigate } from 'react-router-dom';
import { selectDarkMode } from '../../store/darkModeSlice';
import { useSelector } from 'react-redux';
import { getAccount } from '../../store/accountSlice';
import { useEffect, useState } from 'react';

const Subscription = () => {
  const navigate = useNavigate();
  const darkMode = useSelector(selectDarkMode);
  const account = useSelector(getAccount);
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

  // Debug: Log current account state
  console.log('🔍 Subscription component - Current account state:', account);
  console.log('🔍 Current plan:', account.currentPlan);
  console.log('🔍 Plan expiry date:', account.planExpiryDate);

  // Get plan details based on currentPlan
  const getPlanDetails = () => {
    switch (account.currentPlan) {
      case 'basic':
        return {
          name: 'Basic Plan',
          price: 5,
          description: 'Basic VPN access with standard features.',
          features: [
            'Standard VPN access',
            'Basic support',
            '1 device',
            'Standard security'
          ]
        };
      case 'premium':
        return {
          name: 'Premium Plan',
          price: 15,
          description: 'Premium VPN access with advanced features.',
          features: [
            'Premium VPN access',
            'Priority support',
            '3 devices',
            'Advanced security'
          ]
        };
      case 'pro':
        return {
          name: 'Pro Plan',
          price: 25,
          description: 'Professional VPN access with all features.',
          features: [
            'Professional VPN access',
            '24/7 support',
            'Unlimited devices',
            'Maximum security'
          ]
        };
      default:
        return {
          name: 'No Active Plan',
          price: 0,
          description: 'You don&apos;t have an active plan.',
          features: []
        };
    }
  };

  const planDetails = getPlanDetails();
  const hasActivePlan = account.currentPlan && account.planExpiryDate;

  return (
    <div className="w-full py-7 px-5 flex flex-col space-y-7">
      <div className="w-full flex items-center justify-between gap-2">
        <h2 className={`font-open-sans text-2xl font-bold ${darkMode ? " text-white" : "text-black"}`}>Active Plan</h2>

        <button
          className='py-2.5 px-12 rounded-lg bg-gradient-to-b from-secondary to-[#F66C6C] text-white text-sm font-semibold font-open-sans'
          onClick={() => navigate('/dashboard/subscription/upgrade-plan')}
        >
          {hasActivePlan ? 'Upgrade Plan' : 'Get Plan'}
        </button>
      </div>

      <div className={`max-w-[341px] w-full ${darkMode ? "bg-[#292929] text-white" : "bg-white text-black"} shadow-cards rounded-[26px] py-7 px-12 flex flex-col gap-4`}>
        {hasActivePlan ? (
          <>
            <button className={`w-full rounded-full text-center mt-[13px] transition-all opacity-40 duration-200 font-open-sans font-semibold py-3 px-9 text-white bg-gradient-to-b from-secondary to-[#F66C6C] shadow-tabs`} disabled>
              Deactivate Plan
            </button>

            <p className={`text-lg text-[#848199] font-open-sans`}>
              <span className={`text-4xl text-secondary font-bold`}>
                {fVpnPrice !== null ? (
                  <>
                    ${(planDetails.price * fVpnPrice).toFixed(2)} <span style={{fontSize:'1rem',marginLeft:4}}>USD</span>
                    <span className="block text-xs font-normal mt-1" style={{fontSize:'0.9rem',color:'#848199'}}>
                      {planDetails.price} FRY/month
                    </span>
                  </>
                ) : (
                  <>
                    {planDetails.price} FRY/month
                  </>
                )}
              </span>
            </p>

            <h2 className={`text-[28px] ${darkMode ? " text-[#b0aae0]" : "text-[#231D4F]"}`}>{planDetails.name}</h2>

            <p className={`text-[15px] ${darkMode ? " text-[#f2f0ff]" : "text-[#848199]"} font-open-sans`}>{planDetails.description}</p>

            {account.planExpiryDate && (
              <p className={`text-sm ${darkMode ? " text-[#f2f0ff]" : "text-[#848199]"} font-open-sans`}>
                Expires: {new Date(account.planExpiryDate).toLocaleDateString()}
              </p>
            )}

            <ul className="space-y-3 flex-grow">
              {planDetails.features.map((feature, index) => (
                <li key={index} className={`flex gap-2 items-center text-[15px] ${darkMode ? " text-[#f2f0ff]" : "text-[#848199]"} font-open-sans`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20C15.5228 20 20 15.5228 20 10C19.9936 4.47982 15.5202 0.00642897 10 0Z" fill="#450001" />
                    <path d="M15.7725 6.83313L10.0683 14.574C9.93228 14.7545 9.72942 14.8727 9.50533 14.9022C9.28124 14.9316 9.05472 14.8698 8.87665 14.7306L4.80331 11.474C4.44387 11.1863 4.38567 10.6617 4.67331 10.3023C4.96096 9.94285 5.48554 9.88465 5.84498 10.1723L9.24165 12.8898L14.4308 5.8473C14.601 5.59195 14.8977 5.45078 15.2032 5.47983C15.5086 5.50887 15.7734 5.70344 15.8924 5.98627C16.0114 6.26911 15.9653 6.59445 15.7725 6.83313Z" fill="white" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <div className="text-center py-8">
              <h3 className={`text-xl ${darkMode ? " text-[#b0aae0]" : "text-[#231D4F]"} font-bold mb-2`}>No Active Plan</h3>
              <p className={`text-[15px] ${darkMode ? " text-[#f2f0ff]" : "text-[#848199]"} font-open-sans mb-4`}>
                You don't have an active VPN plan. Choose a plan to get started.
              </p>
              <button
                className='py-3 px-8 rounded-lg bg-gradient-to-b from-secondary to-[#F66C6C] text-white text-sm font-semibold font-open-sans'
                onClick={() => navigate('/packages')}
              >
                Choose Plan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Subscription;