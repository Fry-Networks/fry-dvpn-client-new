import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Cookies from 'js-cookie'
import { copy } from '../../assets';
import { useSelector, useDispatch } from 'react-redux';
import { getAccount, setAccount } from '../../store/accountSlice';
import axios from 'axios';
import { LuMoveLeft } from 'react-icons/lu';
import PrimaryButton from '../../components/PrimaryButton';
import { selectDarkMode } from '../../store/darkModeSlice';
import generateWallet from '../../utils/generateWallet';

const GenerateWallet = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const hastokens = Cookies.get('tokens');
    const [copied, setCopied] = useState(false);
    const [isCreating, setIsCreating] = useState(true);
    const [error, setError] = useState('');
    const [balanceUSD, setBalanaceUSD] = useState(0);
    const [fryBalance, setFryBalance] = useState('Loading...');
    const [hasOptedInToFry, setHasOptedInToFry] = useState(false);
    const [isOptingIn, setIsOptingIn] = useState(false);
    const account = useSelector(getAccount);
    const darkMode = useSelector(selectDarkMode);

    const createNewWallet = async () => {
        try {
            setIsCreating(true);
            setError(null);
            
            console.log('Creating new wallet...');
            console.log('Checking if window.wgAPI exists:', !!window.wgAPI);
            console.log('Checking if window.wgAPI.createWallet exists:', !!window.wgAPI?.createWallet);
            
            if (!window.wgAPI || !window.wgAPI.createWallet) {
                throw new Error('Wallet creation API not available');
            }
            
            const result = await Promise.race([
                window.wgAPI.createWallet(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Wallet creation timed out after 30 seconds')), 30000)
                )
            ]);
            
            console.log('Wallet creation result:', result);
            
            if (result.success) {
                console.log('New wallet created successfully');
                console.log('Wallet address:', result.address);
                console.log('Seed phrase length:', result.seedPhrase ? result.seedPhrase.split(' ').length : 'undefined', 'words');
                
                // Validate wallet data
                if (!result.address || !result.seedPhrase) {
                    throw new Error('Generated wallet is missing address or seed phrase');
                }
                
                // Store wallet data in Redux and localStorage
                const walletData = {
                    walletAddress: result.address,
                    balance: '0', // New wallet starts with 0 balance
                    seedPhrase: result.seedPhrase,
                    timestamp: new Date().toISOString()
                };
                
                dispatch(setAccount(walletData));
                localStorage.setItem('account', JSON.stringify(walletData));
                
                // Clear logout timestamp since user is now authenticated
                localStorage.removeItem('lastLogoutTime');
                
                console.log('Wallet data stored successfully');
                
                // Automatically opt-in to FRY tokens
                console.log('Automatically opting in to FRY tokens...');
                try {
                    const optInResult = await window.wgAPI.optInFry({ seedPhrase: result.seedPhrase });
                    console.log('FRY opt-in result:', optInResult);
                    
                    if (optInResult.success) {
                        console.log('✅ Successfully opted in to FRY tokens during wallet creation');
                        setHasOptedInToFry(true);
                    } else {
                        console.log('ℹ️ FRY opt-in status during wallet creation:', optInResult.message);
                    }
                } catch (optInError) {
                    console.log('ℹ️ FRY opt-in during wallet creation failed (this is normal for new wallets):', optInError.message);
                    // Don't throw error here - wallet creation was successful, opt-in can be done later
                }
                
            } else {
                throw new Error(result.message || 'Failed to create wallet');
            }
        } catch (err) {
            console.error('Error creating wallet:', err);
            
            // Try fallback wallet creation using local utility
            try {
                console.log('Trying fallback wallet creation...');
                const fallbackResult = await generateWallet();
                console.log('Fallback wallet created:', fallbackResult);
                
                if (fallbackResult && fallbackResult.walletAddress && fallbackResult.seedPhrase) {
                    const walletData = {
                        walletAddress: fallbackResult.walletAddress,
                        balance: fallbackResult.balance.toString(),
                        seedPhrase: fallbackResult.seedPhrase,
                        timestamp: new Date().toISOString()
                    };
                    
                    dispatch(setAccount(walletData));
                    localStorage.setItem('account', JSON.stringify(walletData));
                    
                    // Clear logout timestamp since user is now authenticated
                    localStorage.removeItem('lastLogoutTime');
                    
                    console.log('Fallback wallet data stored successfully');
                    
                    // Try FRY opt-in for fallback wallet too
                    try {
                        const optInResult = await window.wgAPI.optInFry({ seedPhrase: fallbackResult.seedPhrase });
                        console.log('Fallback wallet FRY opt-in result:', optInResult);
                    } catch (optInError) {
                        console.log('Fallback wallet FRY opt-in failed:', optInError.message);
                    }
                    
                    return; // Success, don't set error
                }
            } catch (fallbackErr) {
                console.error('Fallback wallet creation also failed:', fallbackErr);
            }
            
            setError(err.message || 'Failed to create wallet. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const getALGOtoUSD = async () => {
        try {
            // Check if we have a cached rate that's less than 5 minutes old
            const cachedRate = localStorage.getItem('algo_usd_rate');
            const cacheTime = localStorage.getItem('algo_usd_rate_time');
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
            
            if (cachedRate && cacheTime && (now - parseInt(cacheTime)) < fiveMinutes) {
                console.log('Using cached ALGO to USD rate:', cachedRate);
                setBalanaceUSD(Number(cachedRate) * Number(account.balance));
                return;
            }
            
            const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd');
            if (response.status === 200) {
                const algoToUsd = response.data.algorand.usd;
                
                // Cache the rate and timestamp
                localStorage.setItem('algo_usd_rate', algoToUsd.toString());
                localStorage.setItem('algo_usd_rate_time', now.toString());
                
                setBalanaceUSD(Number(algoToUsd) * Number(account.balance));
                console.log('ALGO to USD rate updated:', algoToUsd);
            }
        } catch (error) {
            console.error('Error fetching the ALGO to USD rate:', error);
            
            // Fallback to cached rate if available, otherwise use a default rate
            const cachedRate = localStorage.getItem('algo_usd_rate');
            if (cachedRate) {
                console.log('Using cached ALGO to USD rate as fallback:', cachedRate);
                setBalanaceUSD(Number(cachedRate) * Number(account.balance));
            } else {
                // Use a reasonable default rate (around $0.2 USD per ALGO)
                console.log('Using default ALGO to USD rate: 0.2');
                setBalanaceUSD(0.2 * Number(account.balance));
            }
        }
    };

    const refreshBalance = async () => {
        try {
            console.log('=== REFRESHING WALLET BALANCE ===');
            console.log('Current wallet address:', account.walletAddress);
            console.log('Current stored balance (BEFORE):', account.balance);
            console.log('Current seed phrase length:', account.seedPhrase?.split(' ').length);
            
            // Fetch current balance from Algorand mainnet
            const response = await axios.get(`https://mainnet-api.algonode.cloud/v2/accounts/${account.walletAddress}`);
            
            if (response.data && response.data.amount !== undefined) {
                const balanceInMicroAlgos = response.data.amount;
                const balanceInAlgos = balanceInMicroAlgos / 1000000; // Convert from microAlgos to ALGO
                
                console.log('✅ Balance fetch successful');
                console.log('Raw API response amount:', balanceInMicroAlgos);
                console.log('Converted balance in ALGO:', balanceInAlgos);
                console.log('Previous stored balance:', account.balance);
                
                // Update Redux store with new balance
                const updatedWalletData = {
                    ...account,
                    balance: balanceInAlgos.toString(),
                    timestamp: new Date().toISOString()
                };
                
                console.log('Updated wallet data balance:', updatedWalletData.balance);
                dispatch(setAccount(updatedWalletData));
                localStorage.setItem('account', JSON.stringify(updatedWalletData));
                
                // Clear logout timestamp since user is now authenticated
                localStorage.removeItem('lastLogoutTime');
                
                // Update balance in database
                try {
                    console.log('Updating wallet balance in database...');
                    const updateResult = await window.dbAPI.updateWalletBalance(account.walletAddress, balanceInAlgos.toString());
                    if (updateResult.success) {
                        console.log('✅ Wallet balance updated in database');
                    } else {
                        console.log('⚠️ Failed to update wallet balance in database:', updateResult.message);
                    }
                } catch (dbError) {
                    console.log('⚠️ Error updating wallet balance in database:', dbError);
                }
                
                // Update USD value
                await getALGOtoUSD();
                
                // Fetch FRY balance
                await refreshFryBalance();
                
                console.log('✅ Balance refreshed successfully');
            } else {
                console.error('❌ Invalid response format:', response.data);
            }
        } catch (error) {
            console.error('❌ Error refreshing balance:', error);
            if (error.response?.status === 404) {
                console.log('ℹ️ Account not found on mainnet - this is normal for new wallets');
                console.log('ℹ️ The wallet exists but has no balance yet');
                console.log('ℹ️ You can fund it using the QR code above');
            } else if (error.response?.status) {
                console.error('❌ HTTP Error:', error.response.status, error.response.statusText);
            } else {
                console.error('❌ Network Error:', error.message);
            }
        }
    };

    const refreshFryBalance = async () => {
        try {
            console.log('=== REFRESHING FRY BALANCE ===');
            console.log('Wallet address:', account.walletAddress);
            
            if (!account.walletAddress) {
                console.error('❌ No wallet address available');
                setFryBalance('No wallet');
                return;
            }
            
            if (!account.seedPhrase) {
                console.error('❌ No seed phrase available');
                setFryBalance('No seed phrase');
                return;
            }
            
            if (!window.wgAPI?.getFryBalance) {
                console.error('❌ getFryBalance API not available');
                setFryBalance('API Error');
                return;
            }
            
            console.log('Calling getFryBalance API...');
            const result = await window.wgAPI.getFryBalance({ seedPhrase: account.seedPhrase });
            
            console.log('FRY balance result:', result);
            
            if (result.success) {
                const balance = result.balance || 0;
                setFryBalance(balance);
                
                // Check if user is actually opted in by checking the message
                const isOptedIn = !result.message?.includes('not opted in') && !result.message?.includes('has not opted in');
                setHasOptedInToFry(isOptedIn);
                
                if (isOptedIn) {
                    console.log('✅ FRY balance updated:', balance);
                } else {
                    console.log('ℹ️ User not opted in to FRY tokens');
                }
            } else {
                console.log('ℹ️ FRY balance check result:', result.message);
                setFryBalance('Not opted in');
                setHasOptedInToFry(false);
            }
        } catch (error) {
            console.error('❌ Error refreshing FRY balance:', error);
            setFryBalance('Error');
            setHasOptedInToFry(false);
        }
    };

    const formatWalletAddress = (address) => {
        if (!address) return '';
        const start = address.slice(0, 12);
        const end = address.slice(-5);
        return `${start}...${end}`;
    };

    const handleCopy = (walletAddress) => {
        if (!walletAddress) return;
        navigator.clipboard.writeText(walletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getQRValue = () => {
        // Algorand wallets expect just the plain address
        // This ensures compatibility with Algorand wallets
        console.log('Wallet address for QR:', account.walletAddress);
        console.log('Wallet address length:', account.walletAddress?.length);
        console.log('Wallet address format check:', /^[A-Z2-7]{58}$/.test(account.walletAddress));
        
        // Validate the address format
        if (!account.walletAddress) {
            console.error('No wallet address available');
            return '';
        }
        
        if (!/^[A-Z2-7]{58}$/.test(account.walletAddress)) {
            console.error('Invalid Algorand address format:', account.walletAddress);
        } else {
            console.log('✅ Valid Algorand address format');
        }
        
        return account.walletAddress;
    };

    const optInToFry = async () => {
        try {
            setIsOptingIn(true);
            console.log('=== OPTING IN TO FRY TOKEN ===');
            console.log('Current wallet address:', account.walletAddress);
            console.log('Current seed phrase length:', account.seedPhrase?.split(' ').length);
            
            if (!account.seedPhrase) {
                console.error('❌ No seed phrase available for opt-in');
                alert('No seed phrase available. Please create a new wallet.');
                return;
            }
            
            // Use the dedicated opt-in function instead of transfer function
            console.log('Calling dedicated optInFry function...');
            const result = await window.wgAPI.optInFry({ seedPhrase: account.seedPhrase });
            
            console.log('Opt-in result:', result);
            
            if (result.success) {
                alert(`✅ ${result.message}\nTransaction ID: ${result.txId || 'N/A'}`);
                setHasOptedInToFry(true);
                
                // Refresh the FRY balance after successful opt-in
                await refreshFryBalance();
            } else {
                alert(`❌ Opt-in failed: ${result.message}`);
            }
        } catch (error) {
            console.error('❌ Opt-in error:', error);
            alert(`❌ Opt-in error: ${error.message}`);
        } finally {
            setIsOptingIn(false);
        }
    };

    const checkFryOptInStatus = async () => {
        try {
            if (!account.walletAddress) return;
            
            if (!account.seedPhrase) {
                console.error('❌ No seed phrase available for opt-in check');
                setHasOptedInToFry(false);
                return;
            }
            
            console.log('Checking FRY opt-in status...');
            const result = await window.wgAPI.getFryBalance({ seedPhrase: account.seedPhrase });
            
            // Check if user is actually opted in by checking the message
            if (result.success) {
                const isOptedIn = !result.message?.includes('not opted in') && !result.message?.includes('has not opted in');
                setHasOptedInToFry(isOptedIn);
                
                if (isOptedIn) {
                    console.log('✅ User is already opted in to FRY tokens');
                } else {
                    console.log('ℹ️ User is not opted in to FRY tokens');
                }
            } else {
                setHasOptedInToFry(false);
                console.log('ℹ️ User is not opted in to FRY tokens');
            }
        } catch (error) {
            console.error('❌ Error checking FRY opt-in status:', error);
            setHasOptedInToFry(false);
        }
    };

    useEffect(() => {
        // Check if we already have a wallet
        if (account.walletAddress && account.seedPhrase) {
            console.log('Wallet already exists, not creating new one');
            setIsCreating(false);
            // Refresh balance to get current amount
            refreshBalance();
            // Check FRY opt-in status
            checkFryOptInStatus();
        } else {
            // Create new wallet
            createNewWallet();
        }
        
        if (hastokens) {
            navigate('/select-service');
        }
        
        // Check if APIs are available
        console.log('=== API AVAILABILITY CHECK ===');
        console.log('window.dbAPI available:', !!window.dbAPI);
        console.log('window.wgAPI available:', !!window.wgAPI);
        console.log('window.testAPI available:', !!window.testAPI);
        console.log('window.electron available:', !!window.electron);
        
        if (window.dbAPI) {
            console.log('dbAPI methods:', Object.keys(window.dbAPI));
        } else {
            console.error('❌ dbAPI is not available on window object');
        }
    }, []);

    useEffect(() => {
        if (account.walletAddress && !isCreating) {
            getALGOtoUSD();
        }
    }, [account.walletAddress, isCreating]);

    if (isCreating) {
        return (
            <div className={`w-full min-h-screen flex justify-center bg-layout bg-cover items-center flex-grow p-10 ${darkMode ? 'bg-[#222222] text-white' : 'bg-primary text-black'}`}>
                <div className={`w-full min-w-[485px] ${darkMode ? 'bg-[#292929] text-white' : 'bg-white text-black'} shadow-cards gap-2.5 px-10 py-[42px] rounded-3xl flex flex-col justify-center items-center max-w-[646px]`}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className='font-open-sans text-xl font-semibold text-center mt-4'>Creating your new wallet...</p>
                    <p className='font-open-sans text-sm text-center mt-2 opacity-70'>Please wait while we generate your secure wallet and opt-in to FRY tokens</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`w-full min-h-screen flex justify-center bg-layout bg-cover items-center flex-grow p-10 ${darkMode ? 'bg-[#222222] text-white' : 'bg-primary text-black'}`}>
                <div className="w-fit absolute top-5 left-5">
                    <LuMoveLeft className="text-3xl cursor-pointer" onClick={() => navigate(-1)} />
                </div>
                <div className={`w-full min-w-[485px] ${darkMode ? 'bg-[#292929] text-white' : 'bg-white text-black'} shadow-cards gap-2.5 px-10 py-[42px] rounded-3xl flex flex-col justify-center items-center max-w-[646px]`}>
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <p className='font-open-sans text-xl font-semibold text-center text-red-500'>Wallet Creation Failed</p>
                    <p className='font-open-sans text-sm text-center mt-2 opacity-70'>{error}</p>
                    <PrimaryButton onClick={createNewWallet} text={'Try Again'} className={'mt-4'} />
                </div>
            </div>
        );
    }

    if (!account.walletAddress || !account.seedPhrase) {
        return (
            <div className={`w-full min-h-screen flex justify-center bg-layout bg-cover items-center flex-grow p-10 ${darkMode ? 'bg-[#222222] text-white' : 'bg-primary text-black'}`}>
                <div className="w-fit absolute top-5 left-5">
                    <LuMoveLeft className="text-3xl cursor-pointer" onClick={() => navigate(-1)} />
                </div>
                <div className={`w-full min-w-[485px] ${darkMode ? 'bg-[#292929] text-white' : 'bg-white text-black'} shadow-cards gap-2.5 px-10 py-[42px] rounded-3xl flex flex-col justify-center items-center max-w-[646px]`}>
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <p className='font-open-sans text-xl font-semibold text-center text-red-500'>No Wallet Data</p>
                    <p className='font-open-sans text-sm text-center mt-2 opacity-70'>Wallet address or seed phrase is missing</p>
                    <PrimaryButton onClick={createNewWallet} text={'Create Wallet'} className={'mt-4'} />
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full min-h-screen flex justify-center bg-layout bg-cover items-center flex-grow p-10 ${darkMode ? 'bg-[#222222] text-white' : 'bg-primary text-black'}`}>

            <div className="w-fit absolute top-5 left-5">
                <LuMoveLeft className="text-3xl cursor-pointer" onClick={() => navigate(-1)} />
            </div>

            <div className={`w-full min-w-[485px] ${darkMode ? 'bg-[#292929] text-white' : 'bg-white text-black'} shadow-cards gap-2.5 px-10 py-[42px] rounded-3xl flex flex-col justify-center items-center max-w-[646px]`}>
                <p className='font-open-sans text-3xl font-semibold text-center'>Your new wallet is created</p>

                <div className='mt-7 w-fit flex flex-col items-center'>
                    <div className="relative group">
                        <QRCodeSVG 
                            value={getQRValue()} 
                            size={120} 
                            level="M"
                            includeMargin={true}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black text-white text-xs p-2 rounded absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-10">
                                {account.walletAddress}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                            </div>
                        </div>
                    </div>
                    
                    <p className='w-[121px] text-center font-open-sans text-xs py-2'>Wallet QR Code for easy Transfer</p>
                    <p className='text-xs text-gray-500 mt-1'>Scan with any Algorand wallet</p>
                </div>

                <div className='my-5 w-full h-[1px] bg-secondary bg-opacity-20' />

                <div className='w-full px-10 flex items-center justify-between gap-6'>
                    <p className='font-open-sans text-xs'>Wallet Balance:</p>
                    <div className="flex items-center gap-3">
                        <h2 className={` ${darkMode ? 'text-[#a81e31]' : 'text-[#5D0F28]'} font-open-sans text-[22px] font-semibold`}>
                            {Number(account.balance).toFixed(6)} ALGO | ${balanceUSD.toFixed(2)} USD
                        </h2>
                        <button
                            onClick={refreshBalance}
                            className={`p-2 rounded-full transition-all hover:scale-110 ${darkMode ? 'bg-[#333333] hover:bg-[#444444]' : 'bg-gray-100 hover:bg-gray-200'}`}
                            title="Refresh balance"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem('account');
                                window.location.reload();
                            }}
                            className={`px-2 py-1 text-xs rounded transition-all ${darkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-100 hover:bg-red-200 text-red-800'}`}
                            title="Clear cached balance and reload"
                        >
                            Clear Cache
                        </button>
                        {Number(account.balance) === 0 && (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                Needs Funding
                            </span>
                        )}
                    </div>
                </div>

                <div className='w-full px-10 flex items-center justify-between gap-6'>
                    <p className='font-open-sans text-xs'>FRY Token Balance:</p>
                    <div className="flex items-center gap-3">
                        <h2 className={` ${darkMode ? 'text-[#a81e31]' : 'text-[#5D0F28]'} font-open-sans text-[22px] font-semibold`}>
                            {typeof fryBalance === 'number' ? (fryBalance / 1000000).toFixed(6) : fryBalance} FRY
                        </h2>
                        <button
                            onClick={refreshFryBalance}
                            className={`p-2 rounded-full transition-all hover:scale-110 ${darkMode ? 'bg-[#333333] hover:bg-[#444444]' : 'bg-gray-100 hover:bg-gray-200'}`}
                            title="Refresh FRY balance"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button
                            onClick={optInToFry}
                            disabled={isOptingIn}
                            className={`px-2 py-1 text-xs rounded-full transition-all ${
                                hasOptedInToFry 
                                    ? 'bg-green-600 text-white cursor-not-allowed' 
                                    : isOptingIn
                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                    : darkMode 
                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                    : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                            title={hasOptedInToFry ? "Already opted in to FRY tokens" : "Opt-in to FRY tokens (requires ALGO for fees)"}
                        >
                            {hasOptedInToFry ? 'Opted In ✓' : isOptingIn ? 'Opting In...' : 'Opt-in FRY'}
                        </button>
                        {Number(account.balance) < 0.001 && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                Needs ALGO
                            </span>
                        )}
                        {fryBalance === 0 && (
                            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                                No FRY Tokens
                            </span>
                        )}
                    </div>
                </div>
                
                {fryBalance === 0 && (
                    <div className='w-full px-10 mt-2'>
                        <p className='text-xs text-gray-500'>
                            ℹ️ FRY balance is 0 because: 1) Wallet needs ALGO balance first (for transaction fees), or 2) FRY tokens not received yet. 
                            Fund your wallet with ALGO first, then use &quot;Opt-in FRY&quot; button to opt-in to FRY tokens.
                        </p>
                    </div>
                )}

                <div className='my-5 w-full h-[1px] bg-secondary bg-opacity-20' />

                <div className='w-full px-10 flex items-center justify-between gap-6'>
                    <p className='font-open-sans text-xs'>Wallet Address:</p>
                    <div className={`${darkMode ? 'text-[#a81e31]' : 'text-[#5D0F28]'} font-open-sans text-[22px] font-semibold relative`}>
                        <div className='w-[219px] h-10 p-2.5 rounded-lg border border-secondary flex items-center justify-between gap-2.5'>
                            <span className={`text-xs font-semibold font-open-sans ${darkMode ? ' text-white/60' : 'text-[#0D0101]'}`}>{formatWalletAddress(account.walletAddress)}</span>
                            <img src={copy} alt="copy" onClick={() => handleCopy(account.walletAddress)} className={`cursor-pointer ${darkMode ? ' brightness-0 invert' : ''}`} />
                        </div>
                        <div className={`absolute z-50 top-0 right-0 mt-[-30px] transition-all duration-500 ${copied ? 'opacity-100' : 'opacity-0 translate-y-2'} ${darkMode ? 'bg-[#222222] text-white' : 'bg-white text-black'} drop-shadow-md text-xs px-2 py-1 rounded`}>
                            Copied!
                        </div>

                        <p className='text-xs pt-2'>Use this wallet for all future transactions.</p>
                    </div>
                </div>

                <div className='my-5 w-full h-[1px] bg-secondary bg-opacity-20' />

                <div className='w-full px-10 flex items-center justify-between gap-6'>
                    <p className='font-open-sans text-xs'>Recovery passphrase:</p>
                    <div className="flex gap-2">
                        <PrimaryButton onClick={() => navigate('/view-passphrase')} text={'View'} className={'!w-fit'} />
                        {/* <PrimaryButton onClick={testDatabaseAPI} text={'Test DB'} className={'!w-fit !bg-blue-500'} /> */}
                    </div>
                </div>

                <div className='my-5 w-full h-[1px] bg-secondary bg-opacity-20' />

                {/* Debug Info */}
                {/* <div className='px-10 w-full text-xs font-open-sans space-y-1 opacity-70'>
                    <p>Debug Info:</p>
                    <p>Address: {account.walletAddress?.slice(0, 20)}...</p>
                    <p>Balance: {account.balance} ALGO</p>
                    <p>Seed Phrase: {account.seedPhrase ? `${account.seedPhrase.split(' ').length} words` : 'None'}</p>
                    <p>FRY Token ID: 2485314946</p>
                    <p>FRY Balance State: {typeof fryBalance === 'number' ? fryBalance.toFixed(6) : fryBalance}</p>
                    <p>Window wgAPI exists: {window.wgAPI ? 'Yes' : 'No'}</p>
                    <p>getFryBalance exists: {window.wgAPI?.getFryBalance ? 'Yes' : 'No'}</p>
                </div> */}

                <ul className='px-10 w-full text-xs font-open-sans space-y-[5px]'>
                    <li className='inline-flex items-center gap-2'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="9" viewBox="0 0 8 9" fill="none">
                            <circle cx="4" cy="4.21484" r="4" fill="#FF0000" />
                        </svg>
                        Transfer funds from your personal wallet to the above wallet address.
                    </li>

                    <li className='inline-flex items-center gap-2'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="9" viewBox="0 0 8 9" fill="none">
                            <circle cx="4" cy="4.21484" r="4" fill="#FF0000" />
                        </svg>
                        You will need at least $9.90 to purchase a subscription.
                    </li>
                </ul>
                
                {/* ALGO Balance Warning */}
                {Number(account.balance) < 0.001 && (
                    <div className='w-full px-10 mt-2 mb-4'>
                        <div className='p-3 rounded-lg bg-yellow-50 border border-yellow-200'>
                            <p className='text-xs text-yellow-800 font-semibold mb-1'>⚠️ Insufficient ALGO Balance</p>
                            <p className='text-xs text-yellow-700 mb-2'>
                                Current balance: <strong>{Number(account.balance).toFixed(6)} ALGO</strong> | Required: <strong>0.001 ALGO</strong>
                            </p>
                            <p className='text-xs text-yellow-700'>
                                You need at least 0.001 ALGO to proceed. Please transfer ALGO to your wallet address above before continuing.
                            </p>
                        </div>
                    </div>
                )}
                
                {/* ALGO Balance Success */}
                {Number(account.balance) >= 0.001 && (
                    <div className='w-full px-10 mt-2 mb-4'>
                        <div className='p-3 rounded-lg bg-green-50 border border-green-200'>
                            <p className='text-xs text-green-800 font-semibold mb-1'>✅ Sufficient ALGO Balance</p>
                            <p className='text-xs text-green-700'>
                                Current balance: <strong>{Number(account.balance).toFixed(6)} ALGO</strong>
                            </p>
                        </div>
                    </div>
                )}
                
                {/* FRY Opt-in Status */}
                {!hasOptedInToFry && Number(account.balance) >= 0.001 && (
                    <div className='w-full px-10 mt-2 mb-4'>
                        <div className='p-3 rounded-lg bg-yellow-50 border border-yellow-200'>
                            <p className='text-xs text-yellow-800 font-semibold mb-1'>⚠️ FRY Token Opt-in Required</p>
                            <p className='text-xs text-yellow-700'>
                                You need to opt-in to FRY tokens before proceeding. Click the &quot;Opt-in FRY&quot; button above.
                            </p>
                        </div>
                    </div>
                )}
                
                {/* All Requirements Met */}
                {Number(account.balance) >= 0.001 && hasOptedInToFry && (
                    <div className='w-full px-10 mt-2 mb-4'>
                        <div className='p-3 rounded-lg bg-green-50 border border-green-200'>
                            <p className='text-xs text-green-800 font-semibold mb-1'>✅ All Requirements Met</p>
                            <p className='text-xs text-green-700'>
                                ALGO balance: <strong>{Number(account.balance).toFixed(6)} ALGO</strong> | FRY opt-in: <strong>Completed</strong> | You can now proceed to the next step.
                            </p>
                        </div>
                    </div>
                )}
                
                <PrimaryButton 
                    onClick={async () => {
                        try {
                            console.log('Saving wallet to database...');
                            console.log('Available APIs on window:', {
                                dbAPI: !!window.dbAPI,
                                wgAPI: !!window.wgAPI,
                                testAPI: !!window.testAPI,
                                electron: !!window.electron
                            });
                            
                            const walletData = {
                                walletAddress: account.walletAddress,
                                seedPhrase: account.seedPhrase,
                                balance: account.balance
                            };
                            
                            // Check if dbAPI is available
                            if (!window.dbAPI) {
                                console.error('❌ dbAPI is not available on window object');
                                alert('Warning: Database API not available. Your wallet data will not be backed up to the database.');
                                navigate('/choose-a-plan');
                                return;
                            }
                            
                            const saveResult = await window.dbAPI.saveWallet(walletData);
                            
                            if (saveResult.success) {
                                console.log('✅ Wallet saved to database successfully');
                                navigate('/choose-a-plan');
                            } else {
                                console.error('❌ Failed to save wallet to database:', saveResult.message);
                                alert('Warning: Failed to save wallet to database. You can still continue, but your wallet data may not be backed up.');
                                navigate('/choose-a-plan');
                            }
                        } catch (error) {
                            console.error('❌ Error saving wallet to database:', error);
                            console.error('Error details:', error.message);
                            console.error('Error stack:', error.stack);
                            alert('Warning: Error saving wallet to database. You can still continue, but your wallet data may not be backed up.');
                            navigate('/choose-a-plan');
                        }
                    }} 
                    text={'Next'} 
                    disabled={Number(account.balance) < 0.001 || !hasOptedInToFry}
                />
            </div>
        </div>
    );
};

export default GenerateWallet;