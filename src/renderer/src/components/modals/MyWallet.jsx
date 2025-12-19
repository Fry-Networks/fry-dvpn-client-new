import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Cookies from 'js-cookie'
import { copy } from '../../assets';
import { useSelector } from 'react-redux';
import { getAccount } from '../../store/accountSlice';
import axios from 'axios';
import { IoMdClose } from 'react-icons/io';
import { selectDarkMode } from '../../store/darkModeSlice';
import PrimaryButton from '../PrimaryButton';

const MyWallet = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const hastokens = Cookies.get('tokens');
    const [copied, setCopied] = useState(false);
    const [balanceUSD, setBalanaceUSD] = useState(0);
    const [fryBalance, setFryBalance] = useState('0');
    const [loadingFryBalance, setLoadingFryBalance] = useState(false);
    const account = useSelector(getAccount);
    const darkMode = useSelector(selectDarkMode);

    const getALGOtoUSD = async () => {
        try {
            const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd');
            if (response.status) {
                const algoToUsd = response.data.algorand.usd;
                setBalanaceUSD(Number(algoToUsd) * Number(account.balance));
            }
        } catch (error) {
            console.error('Error fetching the ALGO to USD rate:', error);
            setBalanaceUSD(0)
        }
    };

    const getFryBalance = async () => {
        if (!account?.seedPhrase) {
            console.log('No seed phrase available for FRY balance check');
            return;
        }

        setLoadingFryBalance(true);
        try {
            console.log('🔍 Fetching FRY balance...');
            if (window.wgAPI && window.wgAPI.getFryBalance) {
                const result = await window.wgAPI.getFryBalance({ seedPhrase: account.seedPhrase });
                console.log('🍟 FRY balance result:', result);
                
                if (result.success) {
                    setFryBalance(result.balance.toString());
                } else {
                    console.error('❌ Failed to get FRY balance:', result.message);
                    setFryBalance('0');
                }
            } else {
                console.error('❌ FRY balance API not available');
                setFryBalance('0');
            }
        } catch (error) {
            console.error('❌ Error fetching FRY balance:', error);
            setFryBalance('0');
        } finally {
            setLoadingFryBalance(false);
        }
    };

    const formatWalletAddress = (address) => {
        const start = address.slice(0, 12);
        const end = address.slice(-5);
        return `${start}...${end}`;
    };

    const handleCopy = (walletAddress) => {
        navigator.clipboard.writeText(walletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        getALGOtoUSD();
        getFryBalance();
        if (hastokens) {
            navigate('/select-service');
        }
    }, [])

    return (
        <>
            <div className={`w-full h-screen fixed top-0 left-0 overflow-hidden z-50 backdrop transition-all duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

            <div className={`w-full h-screen fixed top-0 left-0 overflow-hidden flex items-center justify-center sm:p-10 p-5 z-50 pointer-events-none`}>
                <div className={`max-w-[761px] overflow-hidden max-h-[776px] w-full rounded-3xl ${darkMode ? 'bg-[#292929] text-white' : 'bg-white text-black'} shadow-card-shadow ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} transition-all duration-300`}>
                    <div className='w-full flex justify-between items-center gap-4 px-9 py-5 border-b border-b-black/30'>
                        <div className='flex-grow'>
                            <div className='flex items-center gap-2'>
                                <h2 className="text-2xl font-bold">My Wallet</h2>
                            </div>
                            <p>Manage your wallet, check balance, and add funds.</p>
                        </div>

                        <IoMdClose className='w-9 h-9 text-xl cursor-pointer text-[#fff] rounded-full bg-secondary p-1' onClick={onClose} />
                    </div>

                    <div className='w-full flex'>
                        <div className={`${darkMode ? 'bg-[#292929] text-white' : 'bg-white text-black'} w-full`}>
                            <div className='p-9 w-full h-full flex-grow gap-2.5  rounded-3xl flex flex-col justify-between items-center'>
                                <div className='w-fit flex flex-col items-center'>
                                    <QRCodeSVG value={account.walletAddress} color='white' />
                                    <p className='w-[121px] text-center font-open-sans text-xs py-2'>Wallet QR Code for easy Transfer</p>
                                </div>

                                <div className='my-7 w-full h-[1px] bg-secondary bg-opacity-20' />

                                <div className='w-full px-10 flex items-center justify-between gap-6'>
                                    <p className='font-open-sans text-xs'>Wallet Balance:</p>
                                    <div className='flex flex-col items-end gap-1'>
                                        <h2 className={` ${darkMode ? 'text-[#a81e31]' : 'text-[#5D0F28]'} font-open-sans text-[22px] font-semibold`}>
                                            {account.balance.toString()} ALGO | ${balanceUSD}USD
                                        </h2>
                                        <div className='flex items-center gap-2'>
                                            <span className={`${darkMode ? 'text-[#a81e31]' : 'text-[#5D0F28]'} font-open-sans text-sm font-semibold flex items-center gap-1`}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                                                    <path d="M19 15L19.5 17L22 17.5L19.5 18L19 20L18.5 18L16 17.5L18.5 17L19 15Z" fill="currentColor"/>
                                                    <path d="M5 15L5.5 17L8 17.5L5.5 18L5 20L4.5 18L2 17.5L4.5 17L5 15Z" fill="currentColor"/>
                                                </svg>
                                                {loadingFryBalance ? 'Loading...' : (parseFloat(fryBalance) / 1000000).toFixed(6)} FRY
                                            </span>
                                            {loadingFryBalance && (
                                                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className='my-7 w-full h-[1px] bg-secondary bg-opacity-20' />

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
                                    <PrimaryButton onClick={() => navigate('/view-passphrase')} text={'View'} className={'!w-fit'} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MyWallet