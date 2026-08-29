import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setAccount } from '../../store/accountSlice';
import { LuMoveLeft } from 'react-icons/lu';
import { Logo } from '../../assets';
import { selectDarkMode } from '../../store/darkModeSlice';
import PrimaryButton from '../../components/PrimaryButton';
import seedPhraseValidation from '../../utils/seedPhraseValidation';

const ConnectExistingWallet = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const darkMode = useSelector(selectDarkMode);
    
    const [seedPhrase, setSeedPhrase] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [walletInfo, setWalletInfo] = useState(null);
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (hasInitialized) return; // Prevent multiple initializations
        
        const initializeFromStoredAccount = () => {
            const storedAccount = localStorage.getItem('account');
            if (storedAccount) {
                try {
                    const accountData = JSON.parse(storedAccount);
                    if (accountData.walletAddress && accountData.seedPhrase) {
                        console.log('📦 Found stored account, but will still ask for seed phrase for security');
                        // Don't automatically redirect - always ask for seed phrase for security
                        setHasInitialized(true);
                        return;
                    }
                } catch (error) {
                    console.error('❌ Error parsing stored account:', error);
                }
            }
            setHasInitialized(true);
        };

        initializeFromStoredAccount();
    }, [dispatch, navigate, hasInitialized]);

    const handleSeedPhraseChange = (e) => {
        setSeedPhrase(e.target.value);
        setError('');
        setWalletInfo(null);
    };

    const validateSeedPhrase = async () => {
        if (!seedPhrase.trim()) {
            setError('Please enter your seed phrase');
            return false;
        }

        const words = seedPhrase.trim().split(/\s+/);
        if (words.length !== 24 && words.length !== 25) {
            setError('Seed phrase must be 24 or 25 words');
            return false;
        }

        return true;
    };

    const connectWallet = async () => {
        try {
            setIsLoading(true);
            setError('');

            // Validate seed phrase format
            if (!await validateSeedPhrase()) {
                return;
            }

            console.log('🔍 Validating seed phrase...');
            
            // Validate seed phrase and get wallet address
            const validationResult = await seedPhraseValidation(seedPhrase.trim());
            console.log('🔍 Validation result:', validationResult);

            if (!validationResult.success) {
                setError('Invalid seed phrase: ' + validationResult.error);
                return;
            }

            const walletAddress = validationResult.wallet_address;
            console.log('✅ Valid wallet address:', walletAddress);

            // Check if wallet exists in database
            console.log('🗄️ Checking wallet in database...');
            if (window.dbAPI && window.dbAPI.getWallet) {
                const dbResult = await window.dbAPI.getWallet(walletAddress);
                // Do not log the raw db result/wallet record - it carries the seed phrase.
                console.log('🗄️ Database result success:', dbResult?.success);

                if (dbResult.success && dbResult.wallet) {
                    const wallet = dbResult.wallet;
                    console.log('✅ Wallet found in database, address:', wallet.address);

                    // Check if wallet has active plan
                    if (wallet.currentPlan && wallet.planExpiryDate) {
                        const expiryDate = new Date(wallet.planExpiryDate);
                        const now = new Date();
                        
                        if (expiryDate > now) {
                            console.log('✅ Wallet has active plan, setting account data');
                            
                            // Set account data from database
                            const accountData = {
                                walletAddress: wallet.walletAddress,
                                balance: wallet.balance.toString(),
                                seedPhrase: wallet.seedPhrase,
                                currentPlan: wallet.currentPlan,
                                planExpiryDate: wallet.planExpiryDate,
                                timestamp: new Date().toISOString()
                            };
                            
                            dispatch(setAccount(accountData));
                            localStorage.setItem('account', JSON.stringify(accountData));
                            
                            // Clear logout timestamp since user is now authenticated
                            localStorage.removeItem('lastLogoutTime');
                            
                            // Navigate to dashboard after successful connection
                            navigate('/dashboard');
                            return;
                        } else {
                            console.log('⚠️ Wallet plan has expired');
                            setWalletInfo({
                                ...wallet,
                                planExpired: true
                            });
                        }
                    } else {
                        console.log('ℹ️ Wallet has no active plan');
                        setWalletInfo({
                            ...wallet,
                            planExpired: false
                        });
                    }
                } else {
                    console.log('❌ Wallet not found in database');
                    setError('Wallet not found in our system. Please create a new wallet or check your seed phrase.');
                    return;
                }
            } else {
                console.error('❌ Database API not available');
                setError('Database connection not available. Please try again.');
                return;
            }

        } catch (error) {
            console.error('❌ Error connecting wallet:', error);
            setError('Failed to connect wallet: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const goToPlanSelection = () => {
        if (!walletInfo) return;
        
        // Set account data from database
        const accountData = {
            walletAddress: walletInfo.walletAddress,
            balance: walletInfo.balance.toString(),
            seedPhrase: walletInfo.seedPhrase,
            currentPlan: walletInfo.currentPlan,
            planExpiryDate: walletInfo.planExpiryDate,
            timestamp: new Date().toISOString()
        };
        
        dispatch(setAccount(accountData));
        localStorage.setItem('account', JSON.stringify(accountData));
        
        // Clear logout timestamp since user is now authenticated
        localStorage.removeItem('lastLogoutTime');
        
        // Navigate to plan selection
        navigate('/choose-a-plan');
    };

    const goToDashboard = () => {
        if (!walletInfo) return;
        
        // Set account data from database
        const accountData = {
            walletAddress: walletInfo.walletAddress,
            balance: walletInfo.balance.toString(),
            seedPhrase: walletInfo.seedPhrase,
            currentPlan: walletInfo.currentPlan,
            planExpiryDate: walletInfo.planExpiryDate,
            timestamp: new Date().toISOString()
        };
        
        dispatch(setAccount(accountData));
        localStorage.setItem('account', JSON.stringify(accountData));
        
        // Clear logout timestamp since user is now authenticated
        localStorage.removeItem('lastLogoutTime');
        
        // Navigate to dashboard
        navigate('/dashboard');
    };

    return (
        <div className={`w-full min-h-screen flex justify-center bg-layout bg-cover items-center flex-grow p-10 ${darkMode ? 'bg-[#222222] text-white' : 'bg-primary text-black'}`}>
            <div className="w-fit absolute top-5 left-5">
                <LuMoveLeft className="text-3xl cursor-pointer" onClick={() => navigate(-1)} />
            </div>
            
            <div className={`w-full min-w-[485px] ${darkMode ? 'bg-[#292929] text-white' : 'bg-white text-black'} shadow-cards gap-2.5 px-10 py-[42px] rounded-3xl flex flex-col justify-center items-center max-w-[646px]`}>
                {/* Logo */}
                <img src={Logo} alt="logo" className="mb-8" />
                
                <p className='font-open-sans text-3xl font-semibold text-center mb-8'>Connect Existing Wallet</p>

                {!walletInfo ? (
                    <div className="w-full space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Enter your seed phrase (24 or 25 words):
                            </label>
                            <textarea
                                value={seedPhrase}
                                onChange={handleSeedPhraseChange}
                                placeholder="Enter your 24 or 25-word recovery phrase separated by spaces..."
                                className={`w-full h-32 p-3 border rounded-lg resize-none ${
                                    darkMode 
                                        ? 'bg-[#333333] border-gray-600 text-white placeholder-gray-400' 
                                        : 'bg-white border-gray-300 text-black placeholder-gray-500'
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        <PrimaryButton
                            onClick={connectWallet}
                            text={isLoading ? 'Connecting...' : 'Connect Wallet'}
                            disabled={isLoading}
                            className="w-full"
                        />

                        <div className="text-center">
                            <p className="text-sm opacity-70">
                                Don&apos;t have a wallet?{' '}
                                <button
                                    onClick={() => navigate('/generate-wallet')}
                                    className="text-blue-500 hover:text-blue-600 underline"
                                >
                                    Create a new wallet
                                </button>
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="w-full space-y-6">
                        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                            <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-green-800 font-semibold">Wallet Found!</span>
                            </div>
                            <p className="text-sm text-green-700">
                                Address: <span className="font-mono">{walletInfo.walletAddress.slice(0, 20)}...</span>
                            </p>
                            <p className="text-sm text-green-700">
                                Balance: <span className="font-semibold">{walletInfo.balance} ALGO</span>
                            </p>
                        </div>

                        {walletInfo.planExpired ? (
                            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                                <div className="flex items-center mb-2">
                                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-yellow-800 font-semibold">Plan Expired</span>
                                </div>
                                <p className="text-sm text-yellow-700">
                                    Your previous plan has expired. Please select a new plan to continue.
                                </p>
                            </div>
                        ) : !walletInfo.currentPlan ? (
                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                <div className="flex items-center mb-2">
                                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-blue-800 font-semibold">No Active Plan</span>
                                </div>
                                <p className="text-sm text-blue-700">
                                    You don&apos;t have an active plan. Please select a plan to get started.
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                <div className="flex items-center mb-2">
                                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-green-800 font-semibold">Active Plan Found</span>
                                </div>
                                <p className="text-sm text-green-700">
                                    Current Plan: <span className="font-semibold">{walletInfo.currentPlan}</span>
                                </p>
                                <p className="text-sm text-green-700">
                                    Expires: <span className="font-semibold">{new Date(walletInfo.planExpiryDate).toLocaleDateString()}</span>
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <PrimaryButton
                                onClick={() => {
                                    setWalletInfo(null);
                                    setSeedPhrase('');
                                    setError('');
                                }}
                                text="Back"
                                className="flex-1"
                            />
                            
                            {walletInfo.planExpired || !walletInfo.currentPlan ? (
                                <PrimaryButton
                                    onClick={goToPlanSelection}
                                    text="Select Plan"
                                    className="flex-1"
                                />
                            ) : (
                                <PrimaryButton
                                    onClick={goToDashboard}
                                    text="Go to Dashboard"
                                    className="flex-1"
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConnectExistingWallet; 