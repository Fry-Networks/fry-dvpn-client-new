import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../../assets';
import { IoIosArrowDown } from 'react-icons/io';
import MyWallet from '../../components/modals/MyWallet';
import { dropdownMenu, sidebarLinks } from '../../constants';
import { getAccount } from '../../store/accountSlice';
import { useSelector, useDispatch } from 'react-redux';
import { setAccount } from '../../store/accountSlice';
import { FaCircleUser } from 'react-icons/fa6';
import { selectDarkMode } from '../../store/darkModeSlice';
import PrimaryButton from '../../components/PrimaryButton';
import { selectIsConnected, resetConnection } from '../../store/connectionSlice';

const DashboardOutlet = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutStep, setLogoutStep] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const account = useSelector(getAccount);
  const connected = useSelector(selectIsConnected);
  const dropdownRef = useRef();
  const darkMode = useSelector(selectDarkMode);

  const formatWalletAddress = (address) => {
    const start = address.slice(0, 6);
    const end = address.slice(-2);
    return `${start}...${end}`;
  };

  const handleLogout = async () => {
    console.log('🔄 Logging out user...');
    setIsLoggingOut(true);
    setLogoutStep('Starting logout process...');
    
    // Track start time for minimum loading duration
    const startTime = Date.now();
    const minLoadingTime = 1500; // Minimum 1.5 seconds of loading
    
    try {
      // First, disconnect VPN if connected
      if (connected) {
        setLogoutStep('Disconnecting VPN...');
        console.log('🔌 Disconnecting VPN before logout...');
        try {
          if (window.wgAPI && window.wgAPI.disconnect) {
            await window.wgAPI.disconnect();
            console.log('✅ VPN disconnected successfully');
            setLogoutStep('VPN disconnected successfully');
          } else {
            console.log('⚠️ wgAPI.disconnect not available');
            setLogoutStep('VPN disconnect skipped (API not available)');
          }
        } catch (error) {
          console.error('❌ Error disconnecting VPN during logout:', error);
          setLogoutStep('VPN disconnect completed (with warnings)');
        }
      }
      
      setLogoutStep('Clearing account data...');
      // Clear account data from Redux store
      dispatch(setAccount({
        walletAddress: '',
        balance: '0',
        seedPhrase: '',
        currentPlan: null,
        planExpiryDate: null
      }));
      
      // Reset connection state
      dispatch(resetConnection());
      
      setLogoutStep('Clearing local storage...');
      // Clear account data from localStorage
      localStorage.removeItem('account');
      
      // Set logout timestamp to prevent backtracking
      localStorage.setItem('lastLogoutTime', new Date().toISOString());
      
      // Close dropdown
      setIsDropdownOpen(false);
      
      setLogoutStep('Finalizing logout...');
      console.log('✅ Account data cleared, redirecting to wallet selection');
      
      // Ensure minimum loading time
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      }
      
      // Redirect to wallet selection screen
      navigate('/');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      setLogoutStep('Error occurred, completing logout...');
      // Even if there's an error, still try to logout
      dispatch(setAccount({
        walletAddress: '',
        balance: '0',
        seedPhrase: '',
        currentPlan: null,
        planExpiryDate: null
      }));
      dispatch(resetConnection());
      
      localStorage.removeItem('account');
      setIsDropdownOpen(false);
      
      // Set logout timestamp to prevent backtracking
      localStorage.setItem('lastLogoutTime', new Date().toISOString());
      
      // Ensure minimum loading time even in error case
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      }
      
      navigate('/');
    } finally {
      setIsLoggingOut(false);
      setLogoutStep('');
    }
  };

  const handleDropdownEvent = (id) => {
    if (id === 1) {
      setIsModalOpen(true);
    } else if (id === 2) {
      navigate('/dashboard/subscription/upgrade-plan');
    } else if (id === 3) {
      // Sign Out
      handleLogout();
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (

    <div className={`w-full flex h-screen overflow-hidden ${darkMode ? 'bg-[#222222]' : 'bg-[#F5F6F7]'}`}>
      <div className='w-full h-screen top-0 left-0 bg-layout bg-cover fixed' />

      {/* Logout Loading Banner */}
      {isLoggingOut && (
        <div className={`fixed top-0 left-0 right-0 z-50 ${darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-600 text-white'} shadow-lg`}>
          {/* Progress Bar */}
          <div className="w-full h-1 bg-blue-800">
            <div className="h-full bg-blue-300 animate-pulse" style={{ width: '100%' }}></div>
          </div>
          
          {/* Content */}
          <div className="p-3 text-center font-semibold">
            <div className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold">Logging out...</span>
                <span className="text-xs opacity-90">{logoutStep}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`w-[252px] top-0 left-0 h-screen inset-0 z-20 md:z-10 relative flex-col ${darkMode ? 'bg-[#292929] text-white' : 'bg-white text-black'} font-open-sans`}
      >
        <div className="flex flex-col mb-5 h-full overflow-y-auto">
          <div className="w-full p-4 flex justify-between sm:justify-center items-center">
            <Link to='/'>
              <img src={Logo} alt="logo" className='sm:w-[90px] w-16 object-contain' />
            </Link>
          </div>

          <div className='w-full h-[0.5px] bg-separator my-4' />

          <ul className="flex flex-col space-y-4 p-5 flex-grow">
            {sidebarLinks.map((link, index) => (
              <li key={index} className='w-full'>
                {link.onClick ? (
                  // Render as clickable div for items with onClick handlers (like Logout)
                  <div
                    onClick={() => {
                      if (link.name === 'Logout' && !isLoggingOut) {
                        handleLogout();
                      }
                    }}
                    className={`${darkMode ? 'bg-[#292929]' : 'bg-white'} group border transition-all duration-200 font-open-sans font-semibold rounded-[10px] py-3 px-8 flex items-center gap-3.5 cursor-pointer hover:text-secondary border-transparent hover:border-secondary hover:shadow-tabs ${isLoggingOut && link.name === 'Logout' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="w-5 h-5">
                      {React.cloneElement(link.svg, {
                        className: "fill-black group-hover:fill-secondary",
                      })}
                    </span>
                    {link.name === 'Logout' && isLoggingOut ? (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging out...
                      </div>
                    ) : (
                      link.name
                    )}
                  </div>
                ) : (
                  // Render as Link for navigation items
                  <Link
                    to={link.path}
                    className={`${darkMode ? 'bg-[#292929]' : 'bg-white'} group border transition-all duration-200 font-open-sans font-semibold rounded-[10px] py-3 px-8 flex items-center gap-3.5 ${(location.pathname === link.path || (link.name === 'Subscription' && location.pathname.endsWith('/subscription/upgrade-plan')))
                      ? "text-secondary border-secondary shadow-tabs"
                      : "hover:text-secondary border-transparent hover:border-secondary hover:shadow-tabs"
                      }`}
                  >
                    <span className="w-5 h-5">
                      {React.cloneElement(link.svg, {
                        className: location.pathname === link.path
                          ? "fill-secondary"
                          : "fill-black group-hover:fill-secondary",
                      })}
                    </span>
                    {link.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          <div className='bg-black w-11/12 h-44 self-center flex flex-col items-center p-5 text-center gap-2.5 rounded-lg'>
            {account?.currentPlan ? (
              <>
                <p className='text-white font-open-sans font-semibold'>Current Package</p>
                <div className='text-white text-sm font-open-sans'>
                  <p className='font-semibold'>{account.currentPlan}</p>
                  {account.planExpiryDate && (
                    <p className='text-[#B4B4B4] text-xs mt-1'>
                      Expires: {new Date(account.planExpiryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Link to="/dashboard/subscription/upgrade-plan">
                  <PrimaryButton 
                    text={'Upgrade Plan'} 
                    className={'!text-sm !px-4 !py-1.5 !w-fit'} 
                  />
                </Link>
              </>
            ) : (
              <>
                <p className='text-white font-open-sans font-semibold'>Select your package</p>
                <span className='text-[#B4B4B4] text-xs font-open-sans'>&quot;Indicate your preference by selecting from the available package options.&quot;</span>
                <Link to="/dashboard/subscription/upgrade-plan">
                  <PrimaryButton text={'Upgrade Your Plan'} className={'!text-sm !px-4 !py-1.5 !w-fit'} />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-[calc(100%-252px)] h-screen overflow-y-auto">
        {/* Header */}
        <header className={`w-full h-[75px] sticky top-0 ${darkMode ? 'bg-[#292929] text-white' : 'bg-white/100 text-black'} z-10 flex items-center border-l border-l-[#6c6a6a45] justify-end px-10 py-4`}>

          <div className='gap-3 flex items-center'>
            <Link to={'https://discord.gg/frynetworks'} target='_blank'>
              <PrimaryButton text={"Report Issue"} className={'!w-fit !mt-0'} />
            </Link>

            <div className='relative' ref={dropdownRef}>
              <div className='flex items-center gap-2 cursor-pointer' onClick={toggleDropdown}>
                <FaCircleUser className={`text-3xl ${darkMode ? 'text-[#686868]' : 'text-gray-300'}`} />

                <div>
                  <h3 className='font-open-sans text-sm -space-y-1 font-semibold'>{formatWalletAddress(account.walletAddress)}</h3>
                </div>

                <IoIosArrowDown className={`text-xl transform transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
              </div>

              <div className={`absolute right-0 transition-all duration-300 ${isDropdownOpen ? 'top-14 opacity-100 pointer-events-auto' : 'top-16 opacity-0 pointer-events-none'} w-48 ${darkMode ? 'bg-[#292929] text-white border-[#686868]' : 'bg-white/100 text-black border-gray-200'} border shadow-lg rounded-lg py-2`}>
                {dropdownMenu.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      if (item.name === 'Sign Out' && isLoggingOut) {
                        return; // Prevent clicking during logout
                      }
                      handleDropdownEvent(item.id);
                    }} 
                    className={`inline-flex cursor-pointer items-center gap-3 px-4 py-2 text-base font-semibold ${darkMode ? ' text-white' : ' text-black'} ${item.name === 'Sign Out' && isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className={` ${darkMode ? 'text-white' : 'text-black'}`}>
                      {item.icon}
                    </span>
                    {item.name === 'Sign Out' && isLoggingOut ? (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging out...
                      </div>
                    ) : (
                      item.name
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Nested Routes */}
        <div className="p-5 relative">
          <Outlet />
        </div>
      </div>

      <MyWallet isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default DashboardOutlet;
