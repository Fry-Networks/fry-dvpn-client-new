import { useNavigate } from 'react-router-dom';
import { Logo } from '../../assets';
import { useWallet } from '@txnlab/use-wallet-react';
import { IoClose } from 'react-icons/io5';
import generateWallet from '../../utils/generateWallet';
import { useDispatch, useSelector } from 'react-redux';
import { setAccount } from '../../store/accountSlice';
import { LuMoveLeft } from 'react-icons/lu';
import { selectDarkMode } from '../../store/darkModeSlice';

const ConnectWallet = () => {
  const navigate = useNavigate();
  const darkMode = useSelector(selectDarkMode);
  const { wallets, activeAccount } = useWallet();
  const dispatch = useDispatch();

  const handleSubmit = async () => {
    if (activeAccount) {
      const result = await generateWallet()
      if (result) {
        dispatch(setAccount({
          walletAddress: result.walletAddress,
          balance: result.balance.toString(),
          seedPhrase: result.seedPhrase
        }));
        localStorage.setItem('account', JSON.stringify({
          walletAddress: result.walletAddress,
          balance: result.balance.toString(),
          seedPhrase: result.seedPhrase,
          timestamp: new Date().toISOString()
        }));
        
        // Clear logout timestamp since user is now authenticated
        localStorage.removeItem('lastLogoutTime');
        
        // Navigate to dashboard after successful connection
        navigate('/dashboard');
      }
      // console.log('Sending request to create bandwidth minor...');
      // window.electron.createBandwidthMinor({ walletAddress: activeAccount.address });

      // window.electron.onBandwidthMinorReply((response) => {
      //   console.log('Response:', response);
      //   if (response.success) {
      //   } else {
      //     alert(response.error);
      //   }
      // });
    }
  };

  return (
    <div className={`w-full h-screen flex justify-center ${darkMode ? 'bg-[#222222] text-white' : 'bg-primary text-black'} items-center flex-grow p-5 relative`}>
      <div className='w-full h-screen absolute top-0 left-0 bg-layout bg-cover bg-fixed' />

      <div className="w-fit absolute top-5 left-5">
        <LuMoveLeft className="text-3xl cursor-pointer" onClick={() => navigate(-1)} />
      </div>

      <div className='w-full relative min-w-[375px] flex flex-col justify-center items-center max-w-[485px]'>
        {/* Logo */}
        <img src={Logo} alt="logo" />

        <div className='mt-[53px] w-full flex flex-col'>
          <h1 className='text-[32px] text-center font-bold font-open-sans mb-3'>Welcome</h1>
          <p className='font-open-sans text-xl mb-[35px]'>Connect your wallet to access the Fry dVPN service.</p>

          {activeAccount ? (
            <div className='w-full flex flex-col items-center justify-center gap-4'>
              <div className={`w-fit border ${darkMode ? 'border-white/20' : 'border-black/20'}  rounded-full p-2 text-xs flex items-center justify-between gap-3`}>
                <span className='opacity-70'>{activeAccount?.address}</span>

                <div className={`p-1 rounded-full ${darkMode ? 'bg-[#292929] text-white' : 'bg-white text-black'} drop-shadow-md text-base`}>
                  <IoClose className='cursor-pointer' onClick={() => {
                    wallets.forEach(wallet => wallet.disconnect());
                  }} />
                </div>
              </div>

              <button
                className='w-full py-2.5 px-12 rounded-lg bg-gradient-to-b z-10 from-secondary to-[#F66C6C] text-white text-sm font-semibold font-open-sans'
                onClick={handleSubmit}
              >
                <span className="xl:text-base md:text-sm text-xs font-semibold">
                  Continue
                </span>
              </button>
            </div>
          ) : (
            <div className='flex flex-col gap-4'>
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className={`w-full xl:h-[65px] h-[50px] p-3 gap-2 cursor-pointer rounded-[10px] ${wallet.id === 'defly' ? 'bg-black text-white' : 'bg-white'} flex items-center shadow-md`}
                  onClick={() => wallet.connect()}
                >
                  <img src={wallet.metadata.icon} alt={wallet.metadata.name} className="w-10" />
                  <span className="xl:text-base md:text-sm text-xs font-semibold">
                    {wallet.metadata.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectWallet;
