import { useEffect, useState } from 'react';
import { step1, step2, step3, step4, step5, upload, download } from '../../assets';
import ConnectBtn from '../../components/ConnectBtn';
import { selectDarkMode } from '../../store/darkModeSlice';
import { useSelector, useDispatch } from 'react-redux';
import { getAccount } from '../../store/accountSlice';
import { 
  selectIsConnected, 
  selectCurrentIP, 
  setConnected,
  setCurrentIP,
} from '../../store/connectionSlice';
import { useConnectionTimer } from '../../hooks/useConnectionTimer';

const DashboardHome = () => {
  const darkMode = useSelector(selectDarkMode);
  const account = useSelector(getAccount);
  const dispatch = useDispatch();
  
  // Use Redux state instead of local state
  const connected = useSelector(selectIsConnected);
  const time = useConnectionTimer(connected);
  const currentIP = useSelector(selectCurrentIP);
  
  const [bytes, setBytes] = useState({
    incoming: 0,
    outgoing: 0,
  });
  const [disconnectInProgress, setDisconnectInProgress] = useState(false);

  const properties = [
    {
      label: "Connection IP",
      value: connected ? currentIP : "Not Connected",
      valueClass: "text-sm font-semibold",
    },
    {
      label: "Status",
      value: connected ? "Connected" : "Disconnected",
      valueClass: `text-sm font-semibold ${connected ? "text-[#63B64E]" : ""
        }`,
    },
  ]

  // Function to get current IP address
  const getCurrentIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      dispatch(setCurrentIP(data.ip));
      return data.ip;
    } catch (error) {
      console.error('Error fetching IP:', error);
      dispatch(setCurrentIP('Unknown'));
      return null;
    }
  };

  useEffect(() => {
    // Get current IP on component mount
    getCurrentIP();
  }, [dispatch]);

  // Simulate bandwidth usage when connected
  useEffect(() => {
    let bandwidthInterval = null;
    
    if (connected) {
      bandwidthInterval = setInterval(() => {
        setBytes({
          incoming: Math.round(Math.random() * 264),
          outgoing: Math.round(Math.random() * 264),
        });
      }, 1000);
    } else {
      setBytes({
        incoming: 0,
        outgoing: 0,
      });
    }
    
    return () => {
      if (bandwidthInterval) {
        clearInterval(bandwidthInterval);
      }
    };
  }, [connected]);

  const formatTime = (timeInSeconds) => {
    const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((timeInSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(timeInSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleConnect = async () => {
    console.log('Connect button clicked');
    console.log('window.wgAPI:', window.wgAPI);
    console.log('window.testAPI:', window.testAPI);
    console.log('window.electron:', window.electron);
    
    // Test if any API is working
    if (window.testAPI) {
      console.log('testAPI.ping():', window.testAPI.ping());
    }
    
    try {
      // Get wallet address from account state
      const walletAddress = account?.walletAddress || account?.addr || account?.address || 'unknown-wallet';
      console.log('Connecting with wallet address:', walletAddress);
      
      await window.wgAPI.connect({ walletAddress });
      dispatch(setConnected(true));
    } catch (err) {
      console.error('Connection error:', err);
      alert('Failed to connect: ' + err);
    }
  };

  const handleDisconnect = async (e) => {
    // Prevent event bubbling
    e?.stopPropagation();
    
    console.log('Disconnect button clicked');
    
    // Prevent multiple disconnect calls
    if (disconnectInProgress) {
      console.log('Disconnect already in progress, ignoring click');
      return;
    }
    
    setDisconnectInProgress(true);
    
    try {
      // Add a 3-4 second delay to show "Disconnecting..." message
      console.log('⏳ Starting disconnect process with delay...');
      await new Promise(resolve => setTimeout(resolve, 3500)); // 3.5 seconds delay
      
      // Update UI state after delay
      dispatch(setConnected(false));
      console.log('✅ UI state updated to disconnected after delay');
      
      const result = await window.wgAPI.disconnect();
      console.log('Disconnect result:', result);
      
      // Reset the flag after disconnect completes
      setDisconnectInProgress(false);
      
    } catch (err) {
      console.error('Disconnection error:', err);
      alert('Failed to disconnect: ' + err);
      setDisconnectInProgress(false); // Reset flag on error
    }
  };

  // handleTransferFry function - Commented out since button is disabled
  /*
  const handleTransferFry = async () => {
    console.log('Transfer FRY button clicked');
    
    try {
      console.log('=== FRY TRANSFER DETAILS ===');
      
      // Check if we have an existing seed phrase wallet
      const hasSeedPhrase = account?.seedPhrase;
      
      if (!hasSeedPhrase) {
        console.log('No existing wallet found, creating new wallet...');
        
        // Ask user if they want to create new wallet or connect existing
        const choice = confirm(
          `No wallet found!\n\n` +
          `Choose an option:\n\n` +
          `Click OK to create a new wallet\n` +
          `Click Cancel to connect existing wallet with seed phrase`
        );
        
        if (choice) {
          // Create a new wallet with seed phrase
          console.log('Calling createWallet...');
          const newWallet = await window.wgAPI.createWallet();
          console.log('createWallet response:', newWallet);
          
          if (newWallet.success) {
            console.log('New wallet created successfully');
            console.log('Wallet address:', newWallet.address);
            console.log('Seed phrase:', newWallet.seedPhrase);
            console.log('Seed phrase length:', newWallet.seedPhrase ? newWallet.seedPhrase.split(' ').length : 'undefined', 'words');
            
            // Validate wallet data
            if (!newWallet.address || !newWallet.seedPhrase) {
              console.error('Wallet data is missing address or seed phrase');
              alert('Error: Generated wallet is missing address or seed phrase. Please try again.');
              return;
            }
            
            // Show the wallet details prominently
            const wordCount = newWallet.seedPhrase ? newWallet.seedPhrase.split(' ').length : 0;
            const walletInfo = 
              `🎉 NEW WALLET CREATED! 🎉\n\n` +
              `📋 WALLET ADDRESS:\n` +
              `${newWallet.address}\n\n` +
              `🔑 RECOVERY PHRASE (${wordCount} words):\n` +
              `${newWallet.seedPhrase}\n\n` +
              `⚠️  IMPORTANT:\n` +
              `• Save this recovery phrase securely\n` +
              `• You'll need it to recover your wallet\n` +
              `• Fund this wallet with ALGO first\n\n` +
              `Click OK to proceed with FRY transfer`;
            
            const confirmed = confirm(walletInfo);
            
            if (!confirmed) {
              // Offer to copy wallet info to clipboard
              const copyChoice = confirm(
                `Would you like to copy your wallet information to clipboard?\n\n` +
                `This will copy:\n` +
                `• Wallet Address\n` +
                `• Recovery Phrase\n\n` +
                `Click OK to copy, Cancel to skip`
              );
              
              if (copyChoice) {
                try {
                  const clipboardText = 
                    `Wallet Address: ${newWallet.address}\n\n` +
                    `Recovery Phrase: ${newWallet.seedPhrase}`;
                  
                  await navigator.clipboard.writeText(clipboardText);
                  alert('✅ Wallet information copied to clipboard!\n\nPlease save it securely before proceeding.');
                } catch (error) {
                  console.error('Failed to copy to clipboard:', error);
                  alert('Failed to copy to clipboard. Please manually save the wallet information.');
                }
              }
              
              alert('Transaction cancelled. Please fund your wallet and try again.');
              return;
            }
            
            // Use the new wallet for transfer
            console.log('Using newly created wallet for transfer');
            console.log('Wallet Address:', newWallet.address);
            console.log('Network: Algorand Mainnet');
            console.log('FRY Token ID: 2485198745');
            console.log('Recipient: [configured via recipient address parameter]');
            console.log('Amount: 1 FRY token');
            console.log('===========================');

            const result = await window.wgAPI.transferFry({ seedPhrase: newWallet.seedPhrase });
            
            console.log('Transfer result:', result);
            
            if (result.success) {
              alert(`✅ ${result.message}\nTransaction ID: ${result.txId}`);
            } else {
              alert(`❌ ${result.message}`);
            }
            return;
          } else {
            console.error('Failed to create wallet:', newWallet.message);
            alert('Failed to create wallet: ' + newWallet.message);
            return;
          }
        } else {
          // Connect existing wallet
          const seedPhrase = prompt(
            `Connect Existing Wallet\n\n` +
            `Enter your seed phrase (24 or 25 words):\n` +
            `(Separate words with spaces)`
          );
          
          if (!seedPhrase || seedPhrase.trim() === '') {
            alert('No seed phrase entered. Transaction cancelled.');
            return;
          }
          
          // Validate seed phrase (basic check)
          const words = seedPhrase.trim().split(/\s+/);
          if (words.length !== 24 && words.length !== 25) {
            alert('Invalid seed phrase. Must be 24 or 25 words. Transaction cancelled.');
            return;
          }
          
          console.log('Connecting existing wallet with seed phrase');
          console.log('Seed phrase length:', words.length, 'words');
          console.log('Network: Algorand Mainnet');
          console.log('FRY Token ID: 2485198745');
          console.log('Recipient: F3RFSU3VN2HXTIVNXUJ2MQUIVMQNMR33QWDQ5D26TSXZD43FA3DGJJSZJM');
          console.log('Amount: 1 FRY token');
          console.log('===========================');

          const result = await window.wgAPI.transferFry({ seedPhrase: seedPhrase.trim() });
          
          console.log('Transfer result:', result);
          
          if (result.success) {
            alert(`✅ ${result.message}\nTransaction ID: ${result.txId}`);
          } else {
            alert(`❌ ${result.message}`);
          }
          return;
        }
      }

      // Use existing seed phrase wallet
      console.log('Using existing seed phrase wallet');
      console.log('Connected Wallet Address:', account.walletAddress || account.addr || account.address || 'Not available');
      console.log('Wallet Seed Phrase Length:', account.seedPhrase.split(' ').length, 'words');
      console.log('Network: Algorand Mainnet');
      console.log('FRY Token ID: 2485198745');
      console.log('Recipient: F3RFSU3VN2HXTIVNXUJ2MQUIVMQNMR33QWDQ5D26TSXZD43FA3DGJJSZJM');
      console.log('Amount: 1 FRY token');
      console.log('===========================');

      // Get FRY balance first
      console.log('=== CHECKING FRY BALANCE ===');
      try {
        const balanceResult = await window.wgAPI.getFryBalance({ seedPhrase: account.seedPhrase });
        console.log('FRY Balance Result:', balanceResult);
        
        if (balanceResult.success) {
          console.log(`✅ FRY Balance: ${balanceResult.balance} tokens`);
        } else {
          console.log(`❌ Failed to get FRY balance: ${balanceResult.message}`);
        }
      } catch (balanceError) {
        console.error('Error getting FRY balance:', balanceError);
      }
      console.log('===========================');

      const result = await window.wgAPI.transferFry({ seedPhrase: account.seedPhrase });
      
      console.log('Transfer result:', result);
      
      if (result.success) {
        alert(`✅ ${result.message}\nTransaction ID: ${result.txId}`);
      } else {
        alert(`❌ ${result.message}`);
      }
      
    } catch (err) {
      console.error('Transfer error:', err);
      alert('Failed to transfer FRY: ' + err);
    }
  };
  */

  return (
    <div className="w-full relative flex flex-col items-center">
      <div className="mt-[140px] mb-[120px] flex flex-col items-center justify-center text-center">
        <div className="w-[200px] h-[150px] mt-4 relative flex items-center justify-center">
          <img
            src={step1}
            alt="step1"
            className={`absolute w-[146px] transition-all duration-500 ${connected ? 'animate-spinDelay75 opacity-100' : 'opacity-0'}`}
          />
          <img
            src={step2}
            alt="step2"
            className={`absolute w-[120px] transition-all duration-500 ${connected ? 'animate-spinDelay150 opacity-100' : 'opacity-0'}`}
          />
          <img
            src={step3}
            alt="step3"
            className={`absolute w-[118px] transition-all duration-500 ${connected ? 'animate-spinDelay500 opacity-100' : 'opacity-0'}`}
          />
          <img
            src={step4}
            alt="step4"
            className={`absolute w-[136px] transition-all duration-500 ${connected ? 'animate-spinDelay75 opacity-100' : 'opacity-0'}`}
          />
          <img
            src={step5}
            alt="step5"
            className={`absolute w-[124px] transition-all duration-500 ${connected ? 'animate-spinDelay500 opacity-100' : 'opacity-0'}`}
          />

          <div className="relative flex items-center justify-center h-[129px] cursor-pointer" onClick={connected ? handleDisconnect : handleConnect}>
            <ConnectBtn />

            <div className="flex flex-col justify-center gap-2 items-center relative ml-1 transition-all duration-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
                <path d="M4.44806 3.54111C4.95013 3.1231 5.68948 3.25755 6.07059 3.78817C6.46516 4.33754 6.32386 5.09905 5.8176 5.54759C4.59455 6.63122 3.6675 8.00369 3.13169 9.54132C2.46176 11.4638 2.43834 13.5444 3.06484 15.4808C3.69134 17.4171 4.93512 19.1085 6.61551 20.309C8.29591 21.5096 10.3254 22.1569 12.4091 22.1569C14.4929 22.1569 16.5223 21.5096 18.2027 20.309C19.8831 19.1085 21.1269 17.4171 21.7534 15.4808C22.3799 13.5444 22.3565 11.4638 21.6865 9.54132C21.1507 8.00369 20.2237 6.63122 19.0006 5.5476C18.4944 5.09905 18.3531 4.33754 18.7476 3.78817C19.1288 3.25755 19.8681 3.1231 20.3702 3.54111C21.5606 4.53223 22.5476 5.73931 23.274 7.09896C24.1834 8.80109 24.6575 10.692 24.6561 12.611C24.6561 19.2015 19.1731 24.5439 12.4091 24.5439C5.6451 24.5439 0.162113 19.2015 0.162113 12.611C0.160694 10.692 0.634833 8.80109 1.54422 7.09896C2.27064 5.73931 3.25761 4.53223 4.44806 3.54111ZM12.4091 12.611C11.7327 12.611 11.1844 12.0626 11.1844 11.3863V1.90268C11.1844 1.2263 11.7327 0.677979 12.4091 0.677979C13.0855 0.677979 13.6338 1.2263 13.6338 1.90268V11.3863C13.6338 12.0626 13.0855 12.611 12.4091 12.611Z" fill="#D1D9E6" />
              </svg>
              <span className="text-xs font-open-sans text-white">{connected ? (disconnectInProgress ? 'Disconnecting...' : 'Disconnect') : 'Connect'}</span>
            </div>
          </div>
        </div>

        {connected ? (
          <div className='flex flex-col items-center gap-3'>
            <div className='flex items-center gap-1 justify-center'>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="15" viewBox="0 0 14 15" fill="none">
                <path d="M12.8333 0H1.16667C0.857247 0 0.560501 0.126681 0.341709 0.352174C0.122916 0.577667 0 0.883501 0 1.2024V5.61369C0 12.3321 5.52708 14.564 6.63542 14.9398C6.87223 15.0201 7.12777 15.0201 7.36458 14.9398C8.47292 14.564 14 12.3321 14 5.61369V1.2024C14 0.883501 13.8771 0.577667 13.6583 0.352174C13.4395 0.126681 13.1428 0 12.8333 0ZM12.8333 5.61369C12.8333 11.4904 7.99167 13.4593 7 13.7975C6.01562 13.4593 1.16667 11.4979 1.16667 5.61369V1.2024H12.8333V5.61369ZM3.39062 7.34965C3.33137 7.29637 3.28318 7.23129 3.24894 7.15832C3.21471 7.08535 3.19515 7.006 3.19144 6.92504C3.18772 6.84409 3.19992 6.76319 3.22732 6.68722C3.25471 6.61124 3.29673 6.54176 3.35084 6.48295C3.40495 6.42414 3.47004 6.37721 3.5422 6.34499C3.61436 6.31277 3.69209 6.29591 3.77073 6.29544C3.84937 6.29497 3.92729 6.31089 3.99981 6.34225C4.07232 6.37361 4.13794 6.41975 4.19271 6.47791L5.92812 8.18381L9.80729 4.37372C9.92071 4.27173 10.068 4.21888 10.2184 4.22621C10.3687 4.23354 10.5105 4.30049 10.6141 4.41306C10.7176 4.52563 10.775 4.6751 10.7741 4.83023C10.7732 4.98536 10.7142 5.13414 10.6094 5.24546L6.33646 9.45385C6.22599 9.56094 6.07978 9.62014 5.92812 9.61917C5.7787 9.61976 5.6349 9.56048 5.52708 9.45385L3.39062 7.34965Z" fill="#63B64E" />
              </svg>
              <span className='text-[#63B64E] font-open-sans text-base font-semibold'>Connected</span>
            </div>
            
            {/* Send FRY Button - Commented out */}
            {/* <button
              onClick={handleTransferFry}
              className={`px-6 py-3 rounded-full font-open-sans font-semibold text-white bg-gradient-to-r from-[#F00] to-[#F66C6C] hover:from-[#D00] hover:to-[#E55A5A] transition-all duration-200 shadow-lg`}
            >
              🍟 Send 1 FRY Token
            </button> */}
          </div>
        ) : (
          <p className={`font-open-sans ${darkMode ? "text-white" : "text-black"} text-center text-base opacity-50`}>Tap to connect!</p>
        )}

        <div className='mt-7'>
          <span className='text-xs text-[#7C7C7C] font-open-sans'>Connecting Time</span>
          <h2 className={`text-[34px] font-bold font-open-sans ${darkMode ? "text-[#e9e9e9]" : "text-[#0D0101]"}`}>{formatTime(time)}</h2>

          <div className='flex items-center justify-center gap-8'>
            <div className='flex items-center justify-center gap-2'>
              <img src={upload} alt="Upload" width="28" height="28" />

              <div className={`text-left text-xs font-open-sans ${darkMode ? "text-white" : "text-black"}`}>
                <span>Upload</span>
                <p><span className='text-[#F00] font-semibold pr-1'>{bytes.incoming}</span>
                  KB/s</p>
              </div>
            </div>

            <div className='flex items-center justify-center gap-2'>
              <img src={download} alt="Download" width="28" height="28" />

              <div className={`text-left text-xs font-open-sans ${darkMode ? "text-white" : "text-black"}`}>
                <span>Download</span>
                <p><span className='text-[#F00] font-semibold pr-1'>{bytes.outgoing}</span>
                  KB/s</p>
              </div>
            </div>
          </div>

          <div className='w-full flex items-center justify-center gap-3 mt-10'>
            {properties.map((item, index) => (
              <div
                key={index}
                className={`text-center w-[126px] p-2.5 rounded-lg ${darkMode ? "bg-[#292929] text-white" : "bg-white text-black"} shadow-cards`}
              >
                <span className="text-xs text-[#7C7C7C] font-open-sans">{item.label}</span>
                <p className={`font-open-sans ${item.valueClass}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome
