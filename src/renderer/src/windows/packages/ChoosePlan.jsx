import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie'
import { useSelector, useDispatch } from 'react-redux';
import { getAccount, updatePlan } from '../../store/accountSlice';
import { LuMoveLeft } from 'react-icons/lu';
import { plans } from '../../constants';
import { IoClose } from 'react-icons/io5';
import buyPlan from '../../utils/buyPlan';
import { Slide, toast } from 'react-toastify';
import { checkSuccess } from '../../assets';
import { selectDarkMode } from '../../store/darkModeSlice';

const ChoosePlan = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const hastokens = Cookies.get('tokens');
    const [subscribed, setsubscribed] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState('');
    const account = useSelector(getAccount);
    const darkMode = useSelector(selectDarkMode);
    const [fVpnPrice, setFVpnPrice] = useState(null);

    console.log('🎯 ChoosePlan component mounted');
    console.log('📊 Account state:', account);
    console.log('🍪 Has tokens:', hastokens);

    useEffect(() => {
        console.log('🔄 ChoosePlan useEffect running');
        console.log('📊 Account in useEffect:', account);
        
        if (hastokens) {
            console.log('🍪 Redirecting to select-service due to tokens');
            navigate('/select-service');
        }
        
        // Check if user already has an active plan
        if (account.currentPlan && account.planExpiryDate) {
            const expiryDate = new Date(account.planExpiryDate);
            const now = new Date();
            
            console.log('📅 Plan expiry check:', { expiryDate, now, isExpired: expiryDate <= now });
            
            if (expiryDate > now) {
                console.log('✅ User has active plan, redirecting to dashboard');
                navigate('/dashboard');
                return;
            }
        } else {
            console.log('ℹ️ No active plan found, staying on plan selection');
        }
    }, [hastokens, account.currentPlan, account.planExpiryDate, navigate])

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

    if (hastokens) {
        return null;
    }

    const handleSubscription = async (plan) => {
        console.log('Selected plan:', plan);
        
        if (!plan.planId) {
            console.error('No planId found for plan:', plan);
            toast.error('Invalid plan selected', {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
                transition: Slide,
            });
            return;
        }

        setIsProcessing(true);
        setProcessingStep('Processing payment...');

        const data = {
            seedPhrase: account.seedPhrase,
            planId: plan.planId
        }
        
        console.log('Calling buyPlan with data:', data);
        const result = await buyPlan(data)
        console.log('buyPlan result:', result);
        
        if (result.success) {
            setsubscribed(true);
            
            console.log('✅ Plan purchase successful:', result);
            console.log('Plan data:', result.plan);
            console.log('Plan expiry date:', result.planExpiryDate);
            
            // Update Redux store with plan information
            dispatch(updatePlan({
                currentPlan: result.plan.planId,
                planExpiryDate: result.planExpiryDate
            }));
            
            console.log('✅ Redux dispatch completed in ChoosePlan component');
            
            toast.success(result.message, {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
                transition: Slide,
            });
        } else {
            toast.error(result.message, {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
                transition: Slide,
            });
        }
        
        setIsProcessing(false);
        setProcessingStep('');
    };

    return (
        <div className={`w-full min-h-screen flex justify-center bg-layout bg-cover items-center flex-grow p-10 ${darkMode ? 'bg-[#222222] text-white' : 'bg-primary text-black'}`}>
            <div className="w-fit absolute top-5 left-5">
                <LuMoveLeft className="text-3xl cursor-pointer" onClick={() => navigate(-1)} />
            </div>
            
            {!subscribed ? (
                <div className={`w-full min-w-[485px] ${darkMode ? 'bg-[#292929] text-white' : 'bg-white text-black'} shadow-cards gap-2.5 px-10 py-[42px] rounded-3xl flex flex-col justify-center items-center max-w-[893px]`}>
                    <p className='font-open-sans text-3xl font-semibold text-center'>Choose A Plan</p>

                    <div className={`mt-[55px] w-[755px] border border-secondary rounded-[26px] ${darkMode ? "bg-[#2b2a2a] text-white" : "bg-[#FFFFFF80] text-black"} backdrop-blur-lg grid grid-cols-2 px-10 py-6 relative`}>
                        <button className='p-2 rounded-full absolute -top-2.5 -right-2.5 bg-secondary text-white z-20' onClick={() => navigate('/dashboard')}>
                            <IoClose />
                        </button>

                        {plans.map((plan, index) => (
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
                                                        <path d="M15.7725 6.83313L10.0683 14.574C9.93228 14.7545 9.72942 14.8727 9.50533 14.9022C9.28124 14.9316 9.05472 14.8698 8.87665 14.7306L4.80331 11.474C4.44387 11.1863 4.38567 10.6617 4.67331 10.3023C4.96096 9.94285 5.48554 9.88465 5.84498 10.1723L9.24165 12.8898L14.4308 5.8473C14.601 5.59195 14.8977 5.45078 15.2032 5.47983C15.5086 5.50887 15.7734 5.70344 15.8924 5.98627C16.0114 6.26911 15.9653 6.59445 15.7725 6.83313Z" fill="white" />
                                                    </svg>
                                                )}

                                                {feature.text}
                                            </li>
                                        ))}
                                    </ul>

                                    <button className={`w-full rounded-full text-center mt-[13px] border transition-all duration-200 font-open-sans font-semibold py-3 px-9 ${darkMode ? 'bg-[#292929]' : 'bg-white'} ${index === 1 ? `${darkMode ? 'text-white' : 'text-black'}  border-none` : 'text-secondary border-secondary'} shadow-tabs ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => handleSubscription(plan)} disabled={isProcessing}>
                                        {isProcessing ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {processingStep || 'Processing...'}
                                            </div>
                                        ) : (
                                            'Choose Plan'
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className={`w-full min-w-[485px]  ${darkMode ? 'bg-[#292929] text-white' : 'bg-white text-black'} shadow-cards gap-2.5 px-6 py-6 rounded-3xl flex flex-col justify-center items-center max-w-[633px]`}>
                    <p className='font-open-sans text-3xl font-semibold text-center'>Choose A Plan</p>

                    <img src={checkSuccess} alt="checkSuccess" className='w-[257px]' />

                    <p className='font-open-sans text-lg'>Payment Confirmed</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className={`mt-4 p-2 w-full py-2.5 px-12 text-[14px] flex items-center justify-center font-semibold cursor-pointer font-open-sans text-white rounded-[10px] bg-gradient-to-b from-[#F00] to-[#F66C6C]`}
                    >
                        Go to Dashboard
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChoosePlan;
