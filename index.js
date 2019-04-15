// IIFE - Immediately Invoked Function Expression
(function (code) {

    // The global jQuery object is passed as a parameter
    code(window.jQuery, window, document);

}(function ($, window, document) {

    // The $ is now locally scoped

    // Listen for the jQuery ready event on the document
    $(async function () {
        initWebSockets()
        // setInterval(() => addStreamEntryFromQueue() , 50)
        let counter = 10;
        const myFunction = function() {
            counter = getRandomInt(5,40);
            addStreamEntryFromQueue()
            setTimeout(myFunction, counter);
        }
        setTimeout(myFunction, counter);
    });



    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
    /*                     API data Retrieval                      */
    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

    /* Base url for all requests */
    const BASE_URL = 'https://web3api.io/api/v1'

    /* Demo key - Get your API Key at amberdata.io/pricing
    * and place yours here! */
    let config = {
        headers: {"x-api-key": "UAK000000000000000000000000demo0001"}
    }

    /**
     * The following methods construct the url and sends it off to axios via the
     * get method.
     * @param address
     * @param number
     */
    let getBlockTransactions = (number) => axios.get(`${BASE_URL}/blocks/${number}/transactions`, config)
    let getBlockFunctions = (number) => axios.get(`${BASE_URL}/blocks/${number}/functions`, config)

    let eventQueue = []
    const addStreamEntryFromQueue = () => {
        if(eventQueue.length > 0) {
            let entry = eventQueue.pop()
            addStreamEntry(entry)
            launchFrom({x: getRandomInt(400, 950), y: getRandomInt(350, 550), colorText: entry.color})
        }
    }

    let initWebSockets = () => {
        // Create WebSocket connection.
        const socket = new WebSocket('wss://ws.web3api.io?x-api-key=UAK000000000000000000000000demo0001');

        // Connection opened
        socket.addEventListener('open', function (event) {
            console.log('Connection opened - ', event.data);
            socket.send(`{"jsonrpc":"2.0","id":${BLOCK},"method":"subscribe","params":["block"]}`);
            socket.send(`{"jsonrpc":"2.0","id":${UNCLE},"method":"subscribe","params":["uncle"]}`);
        });

        // Listen for messages
        socket.addEventListener('message', responseHandler);

        // Listen for messages
        socket.addEventListener('close', function (event) {
            console.log('Connection closed - ', event.data);
        });
    }

    const BLOCK = 0, UNCLE = 1, TXN = 2, INTERNAL_MSG = 3
    const TYPE_COLOR = ['green', 'orange', 'firebrick', 'blue']
    const TYPE_LABELS = ['Block', 'Uncle', 'Transaction', 'Internal Message']
    const getEntryBg = () => $('#stream #list').children().length % 2 ? '#F9F9F9' : 'white'
    const renderEntry = (entry) => `
            <div style="background: ${getEntryBg()}" class="entry">
                <div style="background: ${entry.color}" class="color"></div>
                <div class="detail">
                    <div class="type">
                        ${entry.detail.type}
                    </div>
                    <div class="value">
                        ${entry.detail.value}
                    </div>
                </div>
                <a href="${entry.link}" target="_blank" class="view">View ></a>
            </div>`

    const addStreamEntry = (entry) => {
        const entryString = renderEntry(entry)
        const entryHTML = $.parseHTML(entryString)
        $('#stream #list').prepend(entryHTML)
    }

    const subscriptions = {

    }

    /**
     * Manages Websocket subscriptions.
     */
    const responseHandler = async (wsEvent) => {
        console.log('Message received')
        const response = JSON.parse(wsEvent.data)
        switch (response.id) {
            case BLOCK: subscriptions[response.result] = new DataHandler(BLOCK); break;
            case UNCLE: subscriptions[response.result] = new DataHandler(UNCLE); break;
        }
        if (response.params) {
            let dataObject = subscriptions[response.params.subscription].createDataObject(response.params.result)
            console.log('type', subscriptions[response.params.subscription].type)
            if (subscriptions[response.params.subscription].type === BLOCK) {
                launchFrom({x: getRandomInt(150, 650), y: getRandomInt(350, 550), colorText: 'green'})
                let txnData = extractData(await getBlockTransactions(response.params.result.number))
                let imData = extractData(await getBlockFunctions(response.params.result.number))

                for(let i = 0; i < txnData.length; i++) {
                    let txnDataObj = new DataHandler(TXN).createDataObject(txnData[i])
                    eventQueue.push(txnDataObj)
                }
                for(let i = 0; i < imData.length; i++) {
                    let imDataObj = new DataHandler(INTERNAL_MSG).createDataObject(imData[i])
                    eventQueue.push(imDataObj)
                }
            } else if(subscriptions[response.params.subscription].type === UNCLE) {
                launchFrom({x: getRandomInt(150, 650), y: getRandomInt(350, 550), colorText: 'orange'})
            }
            addStreamEntry(dataObject)
        }
    }

    class DataHandler {
        constructor(type) {
            this.type = type
        }

        createDataObject(data) {
            return {
                color: TYPE_COLOR[this.type],
                detail: {
                    type: TYPE_LABELS[this.type],
                    value: this.getValue(data)
                },
                link: this.getLink(data)
            }
        }
        getValue(data) {
            switch (this.type) {
                case BLOCK:
                case UNCLE: return parseInt(data.number).toLocaleString('en')
                case TXN: return data.hash
                case INTERNAL_MSG: return data.transactionHash
                // case..., etc.
            }
        }

        getLink(data) {
            console.log('https://amberdata.io/blocks/' + data.number)
            switch (this.type) {
                case BLOCK: return 'https://amberdata.io/blocks/' + data.number
                case UNCLE: return 'https://amberdata.io/uncles/' + data.number
                case TXN: return'https://amberdata.io/transactions/' + data.hash
            }
        }
    }

    /* Get's to the data we want. Makes things clearer.*/
    const extractData = (data) => data.data.payload

    const getRandomInt = (min, max, _min = Math.ceil(min), _max = Math.floor(max) ) => Math.floor(Math.random() * (_max - _min)) + _min;

}));