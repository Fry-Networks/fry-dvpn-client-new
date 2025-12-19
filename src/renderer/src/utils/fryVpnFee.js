import * as algokit from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment } from '../config/getAlgoClientConfigs'

// const FEE_WALLET = 'TINQ25R3FHBYQ66ONTOQTHRNGKC73HTQKJCIVEJGEGPDQPVDCHAWRRPJEQ'
// const FEE_WALLET = '7KSPCJUIGA46TZ7NCOPERMGL6GPOVYWRGZEJRUNWRWPZUNNM3OXAB5AZBY'
const FEE_WALLET = 'E2F2LT2INE75DBOYHQXTCTOP2PAP5MHAXQRXTTCCXFKHQTVG36DJONBQZE'
const FRY_TOKEN_ID = 2485314946n
const PERA_SEED_PHRASE =
  'pull daughter daring crunch umbrella oxygen subject arm exist organ wool lucky glass draw loop taste tuition wait old scout also huge awesome able shine'
const createAlgorandClient = async () => {
  algokit.Config.configure({ populateAppCallResources: true })

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorandClient = algokit.AlgorandClient.fromConfig({ algodConfig })
  // algorandClient.setDefaultSigner(signer);

  const algodClient = algokit.getAlgoClient({
    server: algodConfig.server,
    port: algodConfig.port,
    token: algodConfig.token
  })

  const indexer = algokit.getAlgoIndexerClient({
    server: algodConfig.server,
    port: algodConfig.port,
    token: algodConfig.token
  })

  return { algorandClient, algodClient, indexer }
}

export const transferFry = async () => {
  try {
    const { algorandClient } = await createAlgorandClient()

    let wallet = algorandClient.account.fromMnemonic(PERA_SEED_PHRASE)

    console.log('Public Wallet Address:', wallet.addr.toString())

    const response = await algorandClient.send.assetTransfer({
      assetId: FRY_TOKEN_ID,
      receiver: FEE_WALLET,
      sender: wallet.addr,
      signer: wallet.signer,
      amount: 0n
    })

    console.log(response)
  } catch (e) {
    console.log(e)
  }
}
