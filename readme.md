MutinyHooks
===========

Your app subscribes to address changes in the MutinyNet Signet (Inspired by https://blockhooks.io/)

```json
HTTP POST
http://localhost:6969/api/api/v2/watch-address

{
  network: 'testnet'
  address: string // A bitcoin address
  webhook: string // Your callback url (an endpoint for us to deliver notifications)
  metadata: string // (optional) An additional payload you want us to pass along with the notification
}

```

When MutinyHooks detects changes on your address it calls your webhook.
```json
{
  address: 'tb1pgj6n2w7xmn8ke5gqau07jxreaf6hpvhx8zxl425vwycjg8dzuxeqdhrzun',
  txid: 'c40275693516e2a9e3a7e5401aa7115845d621ada75fabd506b5c61305287a4a',
  hex: '020000000001019766728e0a258b3a70b02ab016b9cda5e875a3d6a4ac87a1fb3ee379cb3333a10100000000fdffffff02eab67f4a000000001600145e5b67bb8c0c4ceded6fdc2052b8d155a99f7ccd0e2700000000000022512044b5353bc6dccf6cd100ef1fe91879ea7570b2e6388dfaaa8c7131241da2e1b20247304402206c0099e14dd3c229612ec0cb069e24da4750a779763cd4253a34d1203e16d34a0220213782998530f1b08be96948d6e9556039557ce5ff2f2e032a5cf316dd54d226012102f1c01458cbe831241f2b7a589c2f3f79c268c008953bdfaa70fc5b9cba44a536f87c0700',
  confirmations: 6,
  network: 'testnet',
  timestamp: 1697178921000,
  webhook: 'http://host.docker.internal:3000/api/public/blockhooks-hook'
}
```

### Docker Compose

To Run this in your dev env:

docker-compose
```
  blockhooks:
    image: ntheile/mutinyhooks:latest
    ports:
      - '6969:6969'
    restart: always
```

MutinyNet Links
=============
- Wallet https://signet-app.mutinywallet.com/receive
- Faucet https://faucet.mutinynet.com/
- Mempool Explorer https://mutinynet.com/

