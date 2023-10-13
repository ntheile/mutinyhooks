require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT || 6969;
const { addressWatcher } = require('./lib.js')
const fetch = require('node-fetch');

app.use(express.json());

app.post('/api/v2/watch-address', async (req, res) => {
  const data = req.body;
  const address = data.address;
  const webhook = data.webhook;
  const metadata = data.metadata ?? process.env.METADATA ?? "";
  const amount = data.amount ?? 1;
  const confirmations = data.confirmations ?? process.env.CONFIRMATIONS ?? 1;
  const network = data.network ?? "testnet";

  if (!address || !webhook || !metadata) {
    return res.status(500).json({})
  }

  addressWatcher({
    address,
    network,
    confirmations,
    metadata,
    amount,
    webhook
  }).then(async (response) => {
    // console.log('Response received:', response);
  }).catch((error) => {
    console.error('Error:', error);;
  });

  return res.json({})
});

app.listen(port, () => {
  console.log(`Mutinyhook app listening at http://localhost:${port}`);
});

