require('dotenv').config();
const fetch = require('node-fetch');

const mutinyNetUrl = process.env.MUTINYNET_URL ?? "https://mutinynet.com/api"
const newUTXOThreshold = process.env.NEW_UTXO_THRESHOLD ?? 900 // experimental feature and possible address reuse (bad practice, but might be nice for dev envs)
const pollingInterval = process.env.POLLING_INTERVAL ?? 3000 // 3 seconds

async function getCurrentBlockTip() {
  const url = `${mutinyNetUrl}/blocks/tip/height`
  const resp = await fetch(url);
  const tip = await resp.json();
  // console.log("tip", tip);
  return tip
}

async function getLastUtxo(address) {
  try {
    const url = `${mutinyNetUrl}/address/${address}/utxo`
    const resp = await fetch(url);
    const json = await resp.json()
    const lastUtxo = json[json.length - 1]
    return lastUtxo
  } catch (e){
    return undefined
  }
}

async function isConfirmed(lastUtxo) {
  try {
    const confirmed = lastUtxo.status.confirmed === true
    if (confirmed) {
      return true
    }
  } catch (e) {
    return false
  }
  return false
}

async function isPaid(lastUtxo, amount) {
  try {
    const paid = lastUtxo.value >= amount
    return paid
  } catch(e){
    return false
  }
}

async function isPaymentConfirmed(lastUtxo) {
  try {
    const confirmations = process.env.CONFIRMATIONS //  0 for zero conf
    const confirmationBlock = lastUtxo.status.block_height
    const tip = await getCurrentBlockTip()
    const confirmationCount = tip - confirmationBlock
    if (confirmationCount >= confirmations) return true
  } catch (e){
    console.error(e)
  }
  return false
}

async function isNewUTXO(lastUtxo) {
  try {
    const tip = await getCurrentBlockTip()
    const isNewUTXO = tip - lastUtxo.status.block_height <= newUTXOThreshold
    return isNewUTXO
  } catch(e){
    return false
  }

}

async function getTxnHex(txid) {
  const url = `${mutinyNetUrl}/tx/${txid}/hex`
  const resp = await fetch(url);
  const txnHex = await resp.text()
  return txnHex
}

async function buildBlockHookResponse({
  address,
  network = "testnet",
  confirmations,
  metadata
}) {
  const lastUtxo = await getLastUtxo(address)
  const txid = lastUtxo.txid
  const txnHex = await getTxnHex(txid)
  let timestamp = lastUtxo?.status?.block_time * 1000 // convert to milliseconds
  if (isNaN(timestamp) || !timestamp){
    timestamp = new Date().getTime()
  }
  const blockhookResp = {
    address,
    txid,
    "hex": txnHex,
    network,
    confirmations,
    timestamp,
    metadata
  };
  return blockhookResp
}

async function sendWebhook(blockhookResp,) {
  try {
    const resp = await fetch(blockhookResp.webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(blockhookResp),
    });
    console.log(`Sent webhook for ${blockhookResp.address} with ${blockhookResp.confirmations} confirmations`)
  } catch (e) {
    console.error("webhook error", e)
  }
}

function addressWatcher({
  address,
  network,
  confirmations,
  metadata,
  amount,
  webhook
}) {
  return new Promise((resolve, reject) => {
    const intervalId = setInterval(async () => {
      try {
        const lastUtxo = await getLastUtxo(address);
        const confirmed = await isConfirmed(lastUtxo);
        const paid = await isPaid(lastUtxo, amount);
        const newUTXO = await isNewUTXO(lastUtxo);

        if (lastUtxo && address) {
          const confirmationBlock = lastUtxo?.status?.block_height
          const tip = await getCurrentBlockTip()
          const confirmationCount = tip - confirmationBlock
          const blockhooksResp = await buildBlockHookResponse({
            address,
            network,
            confirmations: confirmationCount ? confirmationCount : 0,
            metadata,
            amount,
          });
          blockhooksResp.webhook = webhook
          // console.log("paid! send webhook", blockhooksResp);
          await sendWebhook(blockhooksResp)
          resolve(blockhooksResp);
          // stop the watchers for confirmed payment
          const paymentConfirmed = await isPaymentConfirmed(lastUtxo);
          if (paymentConfirmed && confirmationCount >= 6) {
            console.log(`Payment Confirmed! Clearing watcher for ${address} with ${confirmationCount} confs`)
            clearInterval(intervalId);
          }
        } else {
          console.log(`mempool watching address ${address}, no activity yet`);
        }
      } catch (error) {
        console.error('An error occurred:', error);
        clearInterval(intervalId);
        reject(error);
      }
    }, pollingInterval);
  });
}

module.exports = {
  addressWatcher,
  buildBlockHookResponse,
}
