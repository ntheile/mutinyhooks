const express = require('express');
const app = express();
const port = 6969;
const { addressWatcher } = require('./lib.js')
const fetch = require('node-fetch');

app.use(express.json());

app.post('/api/v2/watch-address', async (req, res) => {
  const data = req.body;
  const address = data.address;
  const webhook = data.webhook;
  const metadata = data.metadata ?? "abcd1234";
  const amount = data.amount ?? 1;
  const confirmations = data.confirmations ?? 6;
  const network = data.network ?? "testnet";


  if (!address || !webhook || !metadata) {
    return res.status(500).json({})
  }

  const watcher = addressWatcher({
    address,
    network,
    confirmations,
    metadata,
    amount,
    webhook
  })
    .then(async (response) => {
      console.log('Response received:', response);
      try {
        const resp = await fetch(response.webhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(response),
        });
      } catch (e) {
        console.error("webhook error", e)
      }

    })
    .catch((error) => {
      console.error('Error:', error);
      res.json({ message: 'ok' });
    });

  return res.json({})
});

app.listen(port, () => {
  console.log(`Mutinyhook app listening at http://localhost:${port}`);
});

