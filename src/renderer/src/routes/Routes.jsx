import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import ConnectWallet from '../windows/wallet/ConnectWallet';
import DashboardOutlet from '../windows/dashboard/DashboardOutlet';
import DashboardHome from '../windows/dashboard/DashboardHome';
import Subscription from '../windows/dashboard/Subscription';
import UpgradePlan from '../windows/dashboard/UpgradePlan';
import Settings from '../windows/dashboard/Settings';
import Welcome from '../windows/wallet/Welcome';
import GenerateWallet from '../windows/wallet/GenerateWallet';
import ChoosePlan from '../windows/packages/ChoosePlan';
import PassphraseKey from '../windows/wallet/PassphraseKey';
import AllServices from '../windows/dashboard/AllServices';
// import Streaming from '../windows/dashboard/Streaming';

import FryTransactions from '../windows/dashboard/FryTransactions';
import WalletOptions from '../windows/wallet/WalletOptions';
import ConnectExistingWallet from '../windows/wallet/ConnectExistingWallet';
import AuthGuard from '../components/AuthGuard';

const appRouter = createMemoryRouter([
  {
    path: "/",
    element: <WalletOptions />,
  },
  {
    path: "/dashboard",
    element: <AuthGuard><DashboardOutlet /></AuthGuard>,
    children: [
      {
        path: "",
        element: <DashboardHome />,
      },
      {
        path: "all-services",
        element: <AllServices />,
      },
      // {
      //   path: "streaming",
      //   element: <Streaming />,
      // },

      {
        path: "fry-transactions",
        element: <FryTransactions />,
      },
      {
        path: "subscription",
        element: <Subscription />,
      },
      {
        path: "subscription/upgrade-plan",
        element: <UpgradePlan />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
  {
    path: "/welcome",
    element: <Welcome />,
  },
  {
    path: "/wallet-options",
    element: <WalletOptions />,
  },
  {
    path: "/connect-wallet",
    element: <ConnectWallet />,
  },
  {
    path: "/generate-wallet",
    element: <GenerateWallet />,
  },
  {
    path: "/view-passphrase",
    element: <AuthGuard><PassphraseKey /></AuthGuard>,
  },
  {
    path: "/choose-a-plan",
    element: <AuthGuard><ChoosePlan /></AuthGuard>,
  },
  {
    path: "/connect-existing-wallet",
    element: <ConnectExistingWallet />,
  },
]);

const Routes = () => {
  return (
    <RouterProvider router={appRouter} />
  );
};

export default Routes;
