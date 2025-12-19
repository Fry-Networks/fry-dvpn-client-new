import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../assets';
import { useDispatch, useSelector } from 'react-redux';
import { setAccount } from '../../store/accountSlice';
import { selectDarkMode } from '../../store/darkModeSlice';

const Welcome = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const darkMode = useSelector(selectDarkMode);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

    useEffect(() => {
        const handlefetchAccount = () => {
            try {
                const storedAccount = localStorage.getItem('account');
                if (storedAccount) {
                    const result = JSON.parse(storedAccount);
                    
                    // Only redirect if we have valid account data AND user hasn't explicitly logged out
                    if (result && result.walletAddress && result.seedPhrase) {
                        // Check if this is a fresh login (not after logout)
                        const lastLogoutTime = localStorage.getItem('lastLogoutTime');
                        const accountTimestamp = result.timestamp || 0;
                        
                        if (!lastLogoutTime || new Date(accountTimestamp) > new Date(lastLogoutTime)) {
                            console.log('✅ Valid account found, redirecting to dashboard');
                            dispatch(setAccount(result));
                            navigate('/dashboard');
                        } else {
                            console.log('⚠️ Account found but user has logged out, clearing stale data');
                            localStorage.removeItem('account');
                        }
                    } else {
                        console.log('ℹ️ No valid account data found');
                    }
                }
            } catch (error) {
                console.error('❌ Error checking stored account:', error);
                // Clear corrupted data
                localStorage.removeItem('account');
            } finally {
                setHasCheckedAuth(true);
            }
        }

        handlefetchAccount();
    }, [dispatch, navigate])

    // Don't render anything until we've checked authentication
    if (!hasCheckedAuth) {
        return null;
    }

    return (
        <div className={`w-full h-screen flex justify-center ${darkMode ? 'bg-[#222222] text-white' : 'bg-primary text-black'}  items-center flex-grow p-5 relative`}>
            <div className='w-full h-screen absolute top-0 left-0 bg-layout bg-cover bg-fixed' />

            <div className='w-full relative min-w-[375px] flex flex-col justify-center items-center max-w-[485px]'>
                {/* Logo */}
                <img src={Logo} alt="logo" className="w-auto h-auto max-w-[200px] max-h-[150px] object-contain" />

                <div className='mt-[53px] w-full flex flex-col'>
                    <h1 className='text-[32px] text-center font-bold font-open-sans mb-3'>Welcome</h1>
                    <p className='font-open-sans text-xl'>Connect your wallet to access the Fry dVPN service.</p>
                    <button
                        onClick={() => navigate('/wallet-options')}
                        className={`mt-4 p-2 w-full py-2.5 px-12 text-[14px] flex items-center justify-center font-semibold cursor-pointer font-open-sans text-white rounded-[10px] bg-gradient-to-b from-[#F00] to-[#F66C6C]`}
                    >
                        Connect Your Wallet
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Welcome;
