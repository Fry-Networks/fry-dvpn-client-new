import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../assets';
import { selectDarkMode } from '../../store/darkModeSlice';
import { useSelector } from 'react-redux';

const WalletOptions = () => {
  const navigate = useNavigate();
  const darkMode = useSelector(selectDarkMode);

  const handleCreateNewWallet = () => {
    navigate('/generate-wallet');
  };

  const handleExistingWallet = () => {
    // Navigate to the connect existing wallet page
    navigate('/connect-existing-wallet');
  };

  return (
    <div className={`w-full h-screen flex justify-center ${darkMode ? 'bg-[#222222] text-white' : 'bg-primary text-black'} items-center flex-grow p-5 relative`}>
      <div className='w-full h-screen absolute top-0 left-0 bg-layout bg-cover bg-fixed' />

      <div className='w-full relative min-w-[375px] flex flex-col justify-center items-center max-w-[485px]'>
        {/* Logo */}
        <img src={Logo} alt="logo" className="w-auto h-auto max-w-[200px] max-h-[150px] object-contain" />

        <div className='mt-[53px] w-full flex flex-col'>
          <h1 className='text-[32px] text-center font-bold font-open-sans mb-3'>Choose Your Wallet</h1>
          <p className='font-open-sans text-xl mb-[35px] text-center'>Select how you want to connect your wallet</p>

          <div className='flex flex-col gap-4'>
            {/* Create New Wallet Option */}
            <button
              onClick={handleCreateNewWallet}
              className={`w-full xl:h-[80px] h-[65px] p-4 gap-4 cursor-pointer rounded-[15px] border-2 border-blue-500 hover:border-blue-600 transition-all duration-200 ${darkMode ? 'bg-[#292929] hover:bg-[#333333]' : 'bg-white hover:bg-blue-50'} flex items-center shadow-lg`}
            >
              <div className={`w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="flex flex-col items-start">
                <span className="xl:text-lg md:text-base text-sm font-semibold">Create New Wallet</span>
                <span className="text-xs opacity-70">Generate a new wallet with seed phrase</span>
              </div>
            </button>

            {/* Use Existing Wallet Option */}
            <button
              onClick={handleExistingWallet}
              className={`w-full xl:h-[80px] h-[65px] p-4 gap-4 cursor-pointer rounded-[15px] border-2 border-green-500 hover:border-green-600 transition-all duration-200 ${darkMode ? 'bg-[#292929] hover:bg-[#333333]' : 'bg-white hover:bg-green-50'} flex items-center shadow-lg`}
            >
              <div className={`w-12 h-12 rounded-full bg-green-500 flex items-center justify-center`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex flex-col items-start">
                <span className="xl:text-lg md:text-base text-sm font-semibold">Use Existing Wallet</span>
                <span className="text-xs opacity-70">Continue with previously connected wallet</span>
              </div>
            </button>
          </div>

          {/* Info Text */}
          <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>New to crypto?</strong> Create a new wallet to get started.<br/>
              <strong>Already have a wallet?</strong> Use your existing wallet for quick access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletOptions; 