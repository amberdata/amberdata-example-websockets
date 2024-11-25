# amberdata-example-websockets
Build your own websocket event stream for Ethereum using Amberdata.io! Example code uses [Amberdata's Websockets](https://docs.amberdata.io/reference#connection)

Check out [the demo page](https://amberdata.github.io/amberdata-example-websockets/)!

### Clone:
``
git clone git@github.com:amberdata/amberdata-example-websockets.git
``

### 1. Get API Key

Go to [amberdata.io](https://amberdata.io/pricing) and click "Get started"

### 2. Build:

Building with Amberdata.io is as simple as a few a few lines of code:

```js
// Instantiate Web3Data
const w3d = new Web3Data('UAK000000000000000000000000demo0001')

// Start socket connection
w3d.connect()
w3d.on({eventName: 'block'}, async block => {
    await responseHandler(new DataHandler(BLOCK).createDataObject(block))
})
w3d.on({eventName: 'uncle'}, async uncle => {
    await responseHandler(new DataHandler(UNCLE).createDataObject(uncle))
})
w3d.on({eventName: 'transaction'}, async txn => {
    await responseHandler(new DataHandler(TXN).createDataObject(txn))
})
w3d.on({eventName: 'function'}, async func => {
    await responseHandler(new DataHandler(INTERNAL_MSG).createDataObject(func))
})
```

See source [here](https://github.com/amberdata/amberdata-example-websockets/blob/f20723472788d07e4b135bd840e32a90dd4566b5/index.js#L41-L61).

## Resources

- [Contributing](./CONTRIBUTING.md)

## Licensing

This project is licensed under the [Apache Licence 2.0](./LICENSE).

