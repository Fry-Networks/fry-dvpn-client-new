const { contextBridge, ipcRenderer } = require('electron')

console.log('=== PRELOAD SCRIPT LOADED ===');
console.log('contextBridge available:', typeof contextBridge);
console.log('ipcRenderer available:', typeof ipcRenderer);
console.log('Current directory:', __dirname);
console.log('Process type:', process.type);

try {
  // Simple test API
  contextBridge.exposeInMainWorld('testAPI', {
    ping: () => 'pong'
  });
  console.log('✅ testAPI exposed successfully');

  // WireGuard API
  contextBridge.exposeInMainWorld('wgAPI', {
    connect: (data) => ipcRenderer.invoke('connect-wg', data),
    disconnect: () => ipcRenderer.invoke('disconnect-wg'),
    getStatus: () => ipcRenderer.invoke('get-wg-status'),
    getStats: () => ipcRenderer.invoke('get-wg-stats'),
    transferFry: (data) => ipcRenderer.invoke('transfer-fry', data),
    transferFryPera: (data) => ipcRenderer.invoke('transfer-fry-pera', data),
    createWallet: () => ipcRenderer.invoke('create-wallet'),
    getFryBalance: (data) => ipcRenderer.invoke('get-fry-balance', data),
    optInFry: (data) => ipcRenderer.invoke('opt-in-fry', data)
  });
  console.log('✅ wgAPI exposed successfully');

  // Database API
  const dbAPI = {
    saveWallet: (walletData) => {
      console.log('Preload: saveWallet called with:', walletData);
      return ipcRenderer.invoke('save-wallet-to-db', walletData);
    },
    getWallet: (walletAddress) => {
      console.log('Preload: getWallet called with:', walletAddress);
      return ipcRenderer.invoke('get-wallet-from-db', walletAddress);
    },
    updateWalletBalance: (walletAddress, newBalance) => {
      console.log('Preload: updateWalletBalance called with:', walletAddress, newBalance);
      return ipcRenderer.invoke('update-wallet-balance-db', { walletAddress, newBalance });
    },
    updateWalletPlan: (walletAddress, planId) => {
      console.log('Preload: updateWalletPlan called with:', walletAddress, planId);
      return ipcRenderer.invoke('update-wallet-plan-db', { walletAddress, planId });
    },
    getAllWallets: () => {
      console.log('Preload: getAllWallets called');
      return ipcRenderer.invoke('get-all-wallets-from-db');
    },
    // Plan management functions
    getAllPlans: () => {
      console.log('Preload: getAllPlans called');
      return ipcRenderer.invoke('get-all-plans-from-db');
    },
    getPlan: (planId) => {
      console.log('Preload: getPlan called with:', planId);
      return ipcRenderer.invoke('get-plan-from-db', planId);
    },
    createPlan: (planData) => {
      console.log('Preload: createPlan called with:', planData);
      return ipcRenderer.invoke('create-plan-in-db', planData);
    },
    updatePlan: (planId, planData) => {
      console.log('Preload: updatePlan called with:', planId, planData);
      return ipcRenderer.invoke('update-plan-in-db', { planId, planData });
    },
    deletePlan: (planId) => {
      console.log('Preload: deletePlan called with:', planId);
      return ipcRenderer.invoke('delete-plan-from-db', planId);
    },
    // FRY Transaction functions
    storeFryTransaction: (transactionData) => {
      console.log('Preload: storeFryTransaction called with:', transactionData);
      return ipcRenderer.invoke('store-fry-transaction-db', transactionData);
    },
    getFryTransactions: (walletAddress) => {
      console.log('Preload: getFryTransactions called with:', walletAddress);
      return ipcRenderer.invoke('get-fry-transactions-db', walletAddress);
    },
    getTotalFryFees: (walletAddress) => {
      console.log('Preload: getTotalFryFees called with:', walletAddress);
      return ipcRenderer.invoke('get-total-fry-fees-db', walletAddress);
    },
    testConnection: () => {
      console.log('Preload: testConnection called');
      return ipcRenderer.invoke('test-database-connection');
    }
  };
  
  contextBridge.exposeInMainWorld('dbAPI', dbAPI);
  console.log('✅ dbAPI exposed successfully');
  console.log('dbAPI object:', dbAPI);
} catch (error) {
  console.error('❌ Error exposing APIs:', error);
  console.error('Error stack:', error.stack);
}

// Electron API
try {
  contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
      send: (channel, data) => ipcRenderer.send(channel, data),
      on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    },
    shell: {
      openExternal: (url) => ipcRenderer.invoke('open-external', url)
    }
  });
  console.log('✅ electron API exposed successfully');
} catch (error) {
  console.error('❌ Error exposing electron API:', error);
}

// Pera Wallet API functions
const peraAPI = {
  // Check if Pera wallet is available
  isAvailable: () => {
    console.log('Checking Pera wallet availability...');
    console.log('window.AlgoSigner:', typeof window.AlgoSigner);
    console.log('window.ethereum:', window.ethereum);
    console.log('window.peraWallet:', window.peraWallet);
    console.log('window.AlgoSigner (direct):', window.AlgoSigner);
    console.log('URL includes pera://:', window.location.href.includes('pera://'));
    console.log('URL includes algorand://:', window.location.href.includes('algorand://'));
    console.log('User Agent:', navigator.userAgent);
    console.log('Platform:', navigator.platform);
    
    // Check for various Pera wallet connection methods
    const hasAlgoSigner = typeof window.AlgoSigner !== 'undefined';
    const hasEthereumPera = window.ethereum && window.ethereum.isPera;
    const hasPeraWallet = window.peraWallet;
    const hasDirectAlgoSigner = window.AlgoSigner;
    const hasMobileConnection = window.location.href.includes('pera://') || window.location.href.includes('algorand://');
    
    // For Electron apps, assume mobile wallet might be available
    // since browser extensions won't be available
    const isElectron = navigator.userAgent.toLowerCase().includes('electron');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log('Is Electron:', isElectron);
    console.log('Is Mobile:', isMobile);
    
    // In Electron, always assume Pera wallet might be available for mobile
    if (isElectron) {
      console.log('Electron detected - assuming mobile Pera wallet might be available');
      return true;
    }
    
    const isAvailable = hasAlgoSigner || hasEthereumPera || hasPeraWallet || hasDirectAlgoSigner || hasMobileConnection;
    
    console.log('Pera wallet available:', isAvailable);
    return isAvailable;
  },
  
  // Connect to Pera wallet
  connect: async () => {
    console.log('Attempting to connect Pera wallet...');
    try {
      // Try AlgoSigner first (browser extension)
      if (typeof window.AlgoSigner !== 'undefined') {
        console.log('Using AlgoSigner...');
        await window.AlgoSigner.connect();
        const accounts = await window.AlgoSigner.accounts({
          ledger: 'MainNet'
        });
        console.log('AlgoSigner accounts:', accounts);
        return { success: true, accounts };
      } 
      // Try ethereum provider (some Pera implementations)
      else if (window.ethereum && window.ethereum.isPera) {
        console.log('Using ethereum provider...');
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        console.log('Ethereum accounts:', accounts);
        return { success: true, accounts };
      }
      // Try direct Pera wallet object
      else if (window.peraWallet) {
        console.log('Using direct peraWallet...');
        const accounts = await window.peraWallet.connect();
        console.log('PeraWallet accounts:', accounts);
        return { success: true, accounts };
      }
      // Check for mobile wallet connection
      else if (window.location.href.includes('pera://') || window.location.href.includes('algorand://')) {
        console.log('Mobile wallet connection detected...');
        // Mobile wallet is already connected
        return { success: true, accounts: [{ address: 'MOBILE_WALLET_CONNECTED' }] };
      }
      // Try to detect any Algorand wallet connection
      else if (window.AlgoSigner) {
        console.log('Using direct AlgoSigner...');
        const accounts = await window.AlgoSigner.accounts({
          ledger: 'MainNet'
        });
        console.log('Direct AlgoSigner accounts:', accounts);
        return { success: true, accounts };
      }
      // For Electron apps, assume mobile wallet is available
      else {
        console.log('No browser wallet detected, assuming mobile wallet for Electron...');
        return { success: true, accounts: [{ address: 'MOBILE_WALLET_AVAILABLE' }] };
      }
    } catch (error) {
      console.log('Pera connection attempt failed:', error);
      // If connection fails, assume mobile wallet might be available
      console.log('Assuming mobile wallet might be available...');
      return { success: true, accounts: [{ address: 'MOBILE_WALLET_AVAILABLE' }] };
    }
  },
  
  // Sign and send transaction
  signAndSendTransaction: async (transaction) => {
    try {
      // Try AlgoSigner first
      if (typeof window.AlgoSigner !== 'undefined') {
        const signedTx = await window.AlgoSigner.sign(transaction);
        const response = await window.AlgoSigner.send({
          ledger: 'MainNet',
          tx: signedTx.blob
        });
        return { success: true, txId: response.txId };
      } 
      // Try ethereum provider
      else if (window.ethereum && window.ethereum.isPera) {
        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [transaction]
        });
        return { success: true, txId: txHash };
      }
      // Try direct Pera wallet
      else if (window.peraWallet) {
        const result = await window.peraWallet.signAndSendTransaction(transaction);
        return { success: true, txId: result.txId };
      }
      // For mobile wallet, create deep link for Pera app
      else {
        console.log('Creating mobile wallet deep link...');
        
        // Create a proper Algorand transaction for mobile Pera wallet
        // Pera wallet uses a specific format for deep links
        const txData = {
          type: 'axfer',
          assetIndex: transaction.assetIndex,
          amount: transaction.amount,
          receiver: transaction.to,
          sender: transaction.from,
          network: 'mainnet'
        };
        
        // Create deep link for Pera wallet using the correct format
        // Try multiple formats for better compatibility
        const simpleUrl = `pera://transaction?asset=${transaction.assetIndex}&amount=${transaction.amount}&receiver=${transaction.to}&network=mainnet`;
        const walletConnectUrl = `pera://walletconnect?uri=wc:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@2&transaction=${encodeURIComponent(JSON.stringify(txData))}`;
        
        console.log('Simple Pera URL:', simpleUrl);
        console.log('WalletConnect Pera URL:', walletConnectUrl);
        console.log('Transaction data:', txData);
        
        // Try to open Pera wallet with simple URL first
        try {
          // For Electron, we need to use shell.openExternal
          if (window.electron && window.electron.shell) {
            const result = await window.electron.shell.openExternal(simpleUrl);
            console.log('Shell openExternal result:', result);
          } else {
            // Fallback to location.href
            window.location.href = simpleUrl;
          }
          console.log('Redirected to Pera wallet');
        } catch (redirectError) {
          console.log('Failed to redirect to Pera wallet:', redirectError);
          // Fallback: show instructions to user
          alert('Please open Pera wallet app to complete the transaction');
        }
        
        return { success: true, txId: 'MOBILE_REDIRECT_' + Date.now() };
      }
    } catch (error) {
      console.log('Transaction signing failed:', error);
      // For mobile, try redirect
      try {
        console.log('Attempting mobile wallet redirect...');
        const txData = {
          type: 'axfer',
          assetIndex: transaction.assetIndex,
          amount: transaction.amount,
          receiver: transaction.to,
          sender: transaction.from,
          network: 'mainnet'
        };
        
        // Create proper Pera wallet deep link
        const walletConnectUri = `wc:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@2?relay-protocol=irn&symKey=${Math.random().toString(36).substr(2, 32)}`;
        const peraUrl = `pera://walletconnect?uri=${encodeURIComponent(walletConnectUri)}&transaction=${encodeURIComponent(JSON.stringify(txData))}`;
        
        // Try to open Pera wallet
        if (window.electron && window.electron.shell) {
          await window.electron.shell.openExternal(peraUrl);
        } else {
          window.location.href = peraUrl;
        }
        console.log('Redirected to Pera wallet after error');
        return { success: true, txId: 'MOBILE_REDIRECT_' + Date.now() };
      } catch (redirectError) {
        console.log('Mobile redirect also failed:', redirectError);
        return { success: false, error: error.message };
      }
    }
  }
};

// Expose peraAPI to window
contextBridge.exposeInMainWorld('peraAPI', peraAPI);

// Listen for Pera transfer requests from main process
ipcRenderer.on('pera-transfer-request', async (event, data) => {
  console.log('Pera transfer request received:', data);
  
  try {
    // Check if Pera wallet is connected using the local peraAPI
    const peraResult = await peraAPI.connect();
    if (!peraResult.success) {
      // Use ipcRenderer.send instead of event.reply
      ipcRenderer.send('pera-transfer-response', { 
        success: false, 
        message: 'Failed to connect Pera wallet: ' + peraResult.error 
      });
      return;
    }
    
    // For mobile wallet, proceed directly without confirmation
    const walletAddress = peraResult.accounts[0].address || peraResult.accounts[0];
    if (walletAddress === 'MOBILE_WALLET_CONNECTED' || walletAddress === 'MOBILE_WALLET_AVAILABLE') {
      console.log('Mobile wallet detected, proceeding with transfer...');
      
      // Show mobile wallet instructions
      const confirmed = confirm(
        `Mobile Pera Wallet Transfer\n\n` +
        `Amount: ${data.amount} FRY tokens\n` +
        `To: ${data.recipient}\n\n` +
        `This will open your Pera wallet app to complete the transaction.\n\n` +
        `Click OK to proceed.`
      );
      
      if (!confirmed) {
        ipcRenderer.send('pera-transfer-response', { 
          success: false, 
          message: 'Transaction cancelled by user' 
        });
        return;
      }
      
      // Sign and send the transaction
      const result = await peraAPI.signAndSendTransaction(data.transaction);
      
      if (result.success) {
        ipcRenderer.send('pera-transfer-response', { 
          success: true, 
          txId: result.txId,
          message: 'Transaction sent to mobile wallet for confirmation' 
        });
      } else {
        ipcRenderer.send('pera-transfer-response', { 
          success: false, 
          message: 'Transaction failed: ' + result.error 
        });
      }
      return;
    }
    
    // For browser extension, show confirmation dialog
    const confirmed = confirm(
      `Confirm FRY Transfer\n\n` +
      `From: ${data.transaction.from}\n` +
      `To: ${data.recipient}\n` +
      `Amount: ${data.amount} FRY tokens\n` +
      `Token ID: ${data.tokenId}\n\n` +
      `Click OK to proceed with the transfer.`
    );
    
    if (!confirmed) {
      ipcRenderer.send('pera-transfer-response', { 
        success: false, 
        message: 'Transaction cancelled by user' 
      });
      return;
    }
    
    // Sign and send the transaction
    const result = await peraAPI.signAndSendTransaction(data.transaction);
    
    if (result.success) {
      ipcRenderer.send('pera-transfer-response', { 
        success: true, 
        txId: result.txId,
        message: 'Transaction sent successfully' 
      });
    } else {
      ipcRenderer.send('pera-transfer-response', { 
        success: false, 
        message: 'Transaction failed: ' + result.error 
      });
    }
    
  } catch (error) {
    console.error('Pera transfer error:', error);
    ipcRenderer.send('pera-transfer-response', { 
      success: false, 
      message: 'Transfer error: ' + error.message 
    });
  }
});

console.log('=== ALL APIs EXPOSED ===');
console.log('Final check - APIs available:');
console.log('- window.testAPI:', typeof window.testAPI);
console.log('- window.wgAPI:', typeof window.wgAPI);
console.log('- window.peraAPI:', typeof window.peraAPI);
console.log('- window.electron:', typeof window.electron);
