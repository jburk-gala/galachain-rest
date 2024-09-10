This is an e2e example of rest on galachain. It can: mint tokens on startup, act as a local gateway to your local galachain instance, and call a few specific methods for tokens via api.

To get started

0. Make sure to run the instructions to get your test network running from the galachain-sdk: https://github.com/GalaChain/sdk/blob/main/docs/getting-started.md
1. Add connection-profiles folder and dev-admin-key folder from the galachain-sdk
2. Copy the .env.development.sample -> .env.development
3. npm start
4. If you want to connect to this with a web3 wallet such as metamask, please see https://github.com/IndiaJonathan/ConnectProofOfConcept


For arbitrary contract calls, provide a signed object to asset/:contract/:method
Contract will be the contract name. The default contracts are: AppleContract, GalaChainToken and PublicKeyContract.
If you want to add your own, add the configuration to contractConfigs in app.service


There are also some specific calls that the server will sign on its own.
Here's a good example test call to give a token:
http://localhost:3001/token/give/1/eth|85F36DCee044DA395F3D858E16aa86C40f8d3fDb

I've also included a postman_collection.json. You can import this directly by drag and dropping into postman!


For startup, it will mint NFTs and provide itself the proper allowances. To specify the NFT data you want minted, please add to NFTs.ts