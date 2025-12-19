import './global.css'
import React from 'react'
import ReactDOM from 'react-dom/client';
import Routes from './routes/Routes';
import {
  WalletId,
  WalletManager,
  WalletProvider,
} from "@txnlab/use-wallet-react";
import {
  WALLET_NETWORK_URL,
  WALLET_PORT,
  WALLET_TOKEN,
  WALLET_CONNECT_PROJECT_ID,
} from "./constants";
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { store } from './store/store'
import { Provider } from 'react-redux'

// Expose store to window for utility functions
window.store = store;
console.log('🔧 Redux store exposed to window:', !!window.store);
console.log('🔧 Redux store dispatch available:', !!window.store?.dispatch);

const walletManager = new WalletManager({
  wallets: [
    WalletId.DEFLY,
    // WalletId.PERA, // Commented out - Pera wallet option disabled
    {
      id: WalletId.WALLETCONNECT,
      options: {
        projectId: WALLET_CONNECT_PROJECT_ID,
      },
    },
  ],
  algod: {
    token: WALLET_TOKEN,
    baseServer: WALLET_NETWORK_URL,
    port: WALLET_PORT,
  },
  options: {
    resetNetwork: true,
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WalletProvider manager={walletManager}>
      <Provider store={store}>
        <Routes />
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          transition={Slide}
        />
      </Provider>
    </WalletProvider>
  </React.StrictMode>
)
