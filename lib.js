const fetch = require('node-fetch');

const mutinyNetUrl = "https://mutinynet.com/api"
const newUTXOThreshold = 900
const pollingInterval = 3000

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
  confirmations = 6,
  metadata
}) {
  const lastUtxo = await getLastUtxo(address)
  const txid = lastUtxo.txid
  const txnHex = await getTxnHex(txid)
  const timestamp = lastUtxo.status.block_time * 1000 // convert to milliseconds
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

        if (confirmed && paid && newUTXO) {
          // Clear the interval and resolve the promise if the condition is met
          clearInterval(intervalId);
          const blockhooksResp = await buildBlockHookResponse({
            address,
            network,
            confirmations,
            metadata,
            amount,
          });
          blockhooksResp.webhook = webhook
          // console.log("paid! send webhook", blockhooksResp);
          resolve(blockhooksResp); // Resolve the promise with the desired value
        } else {
          console.log(`not ready yet. fully paid:${paid}, confirmed:${confirmed}, newUTXO:${newUTXO}`);
        }
      } catch (error) {
        console.error('An error occurred:', error);
        clearInterval(intervalId);
        reject(error);
      }
    }, pollingInterval);
  });
}

function test() {
  const watcher = addressWatcher({
    address: "tb1pemzeus46wdgzut0a3pg649qjny2s6gxww6eelgukzuaawakucv8sv4nrl2",
    network: "testnet",
    confirmations: 6,
    metadata: "abcd",
    amount: 1,
    webhook: "http://localhost:3000/api/public/blockhooks-hook"
  }).then(async (response) => {
    console.log('Response received:', response, response.webhook);
    const resp = await fetch(response.webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    });
    console.log("webhook response", resp.status)
  }).catch((error) => {
    console.error('Error:', error);
  });
}
// test()

module.exports = {
  addressWatcher,
  buildBlockHookResponse
}
