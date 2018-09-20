import * as crypto from 'blockchain-wallet-v4/src/walletCrypto'
import {
  getParentPath,
  createXPUB,
  publicKeyChainCodeToBip32
} from 'blockchain-wallet-v4/src/utils/btc'
import { deriveAddressFromXpub } from 'blockchain-wallet-v4/src/utils/eth'
import { Types } from 'blockchain-wallet-v4/src'
import { prop } from 'ramda'

// TODO :: probably deprecated. You should getXpub only
const deriveDeviceInfo = async btcTransport => {
  const btc = await btcTransport.getWalletPublicKey("44'/0'/0'")
  const bch = await btcTransport.getWalletPublicKey("44'/145'/0'")
  const eth = await btcTransport.getWalletPublicKey("44'/60'/0'/0/0")

  return { btc, bch, eth }
}

// TODO :: publicKeyChainCodeToBip32 must be removed and use getXpub
const deriveDeviceId = btcXpub => {
  try {
    const xpub = publicKeyChainCodeToBip32(btcXpub)
    return crypto.sha256(crypto.sha256(xpub).toString('hex')).toString('hex')
  } catch (e) {
    throw new Error('BTC Device Info Required')
  }
}

// TODO :: publicKeyChainCodeToBip32 must be removed removed and use getXpub
const generateAccountsMDEntry = (newDevice, deviceName) => {
  const deviceId = prop('id', newDevice)
  const deviceType = prop('type', newDevice)

  try {
    const { btc, bch, eth } = prop('info', newDevice)
    const btcXpub = publicKeyChainCodeToBip32(btc)
    const bchXpub = publicKeyChainCodeToBip32(bch)
    const ethXpub = publicKeyChainCodeToBip32(eth)

    return {
      device_id: deviceId,
      device_type: deviceType,
      device_name: deviceName,
      btc: { accounts: [btcAccount(btcXpub, deviceName + ' - BTC Wallet')] },
      bch: { accounts: [btcAccount(bchXpub, deviceName + ' - BCH Wallet')] },
      eth: { accounts: [ethAccount(ethXpub, deviceName + ' - ETH Wallet')] }
    }
  } catch (e) {
    throw new Error('mising_device_info')
  }
}

const ethAccount = (xpub, label) => ({
  label: label,
  archived: false,
  correct: true,
  addr: deriveAddressFromXpub(xpub)
})

const btcAccount = (xpub, label) => Types.HDAccount.js(label, null, xpub)

const getXpub = async (ledgerApp, path) => {
  let parentPath = getParentPath(path)
  let child = await ledgerApp.getWalletPublicKey(path)
  let parent = await ledgerApp.getWalletPublicKey(parentPath)
  return createXPUB(path, child, parent)
}

export default {
  btcAccount,
  deriveDeviceInfo,
  deriveDeviceId,
  ethAccount,
  generateAccountsMDEntry,
  getXpub
}
