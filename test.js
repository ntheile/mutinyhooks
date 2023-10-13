require('dotenv').config();
const { addressWatcher } = require('./lib.js');

const watcher = addressWatcher({
  address: "tb1p8r4dh5rmgjp33peuug8qa347yfhw654hr30ts2r9y7p6j44660gsju2dgr",
  network: "testnet",
  confirmations: 1,
  metadata: process.env.METADATA ?? "",
  amount: 1,
  webhook: "http://localhost:3000/api/public/blockhooks-hook"
}).then(async (response) => {
  console.log('Response received:', response);
}).catch((error) => {
  console.error('Address Watcher Error:', error);
});

