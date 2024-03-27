This is an e2e example of rest on galachain that will be cleaned up later

To get started 

0. Make sure to run the instructions to get your test network running from the galachain-sdk: https://github.com/GalaChain/sdk/blob/main/docs/getting-started.md
1. Add connection-profiles folder and dev-admin-key folder from the galachain-sdk
2. Copy the .env.development.sample -> .env.development
3. npm start 

Here's a good example test call to give a token:
http://localhost:3001/token/give/1/eth|85F36DCee044DA395F3D858E16aa86C40f8d3fDb

I've also included a postman_collection.json. You can import this directly by drag and dropping into postman!