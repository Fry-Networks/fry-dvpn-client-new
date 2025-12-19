import algosdk from 'algosdk';
import { getAlgodConfigFromViteEnvironment } from '../config/getAlgoClientConfigs';

const generateWallet = async () => {
  const generatedAccount = algosdk.generateAccount();
  const seedPhrase = algosdk.secretKeyToMnemonic(generatedAccount.sk);
  const walletAddress = algosdk.encodeAddress(generatedAccount.addr.publicKey);

  const algodConfig = getAlgodConfigFromViteEnvironment();

  const algodClient = new algosdk.Algodv2(algodConfig.token, algodConfig.server, algodConfig.port);

  let balance = 0;
  try {
    const acctInfo = await algodClient.accountInformation(walletAddress).do();
    balance = acctInfo.amount / 1000000; // Convert from microAlgos to ALGO
  } catch (error) {
    console.error('Error fetching account information:', error);
  }

  return {
    walletAddress,
    balance,
    seedPhrase,
  };
};

export default generateWallet;
