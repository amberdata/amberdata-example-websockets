// IIFE - Immediately Invoked Function Expression
(function (code) {

    // The global jQuery object is passed as a parameter
    code(window.jQuery, window, document);

}(function ($, window, document) {

    // The $ is now locally scoped

    // Listen for the jQuery ready event on the document
    $(async function () {

        initWebSockets()
        let counter = 10;
        const myFunction = function() {
            counter = getRandomInt(5,50);
            let entry = eventQueue.pop()
            if (entry) {
                launchFrom({x: getRandomInt(window.innerWidth  / 3, window.innerWidth  / 2), colorText: entry.color, explosionSize: 2})
            }
            setTimeout(myFunction, counter);
        }
        setTimeout(myFunction, counter);
    });

    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
    /*                     API data Retrieval                      */
    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

    /* Demo key - Get your API Key at amberdata.io/pricing
    * and place yours here! */

    const BLOCK = 0, UNCLE = 1, TXN = 2, INTERNAL_MSG = 3
    const w3d = new Web3Data('UAK000000000000000000000000demo0001')
    const initWebSockets = () => {
        w3d.connect()
        w3d.on({eventName: 'block'}, async block => {
            const txnData = await w3d.block.getTransactions(block.number, {includePrice: true, includeTokenTransfers: true})
                .then(txns => ({ totalTransactions: txns.length, totalEthTransferred: txns.reduce( (total, txn) => total + parseFloat(txn.price.value.total), 0 ) }))
            if(!hasParentBlock(block.number)) {
                addBlockEntry(new DataHandler(BLOCK).createDataObject(block))
            }
            else {
                $(`#block-${block.number} .stats .eth-trans`).text(`Ether Transferred - ${txnData.totalEthTransferred.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`)
            }
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
    }

    const TYPE_COLOR = ['green', 'orange', 'firebrick', 'blue']
    const TYPE_NAMES = ['Block', 'Uncle', 'Transaction', 'Internal Message']
    const TYPE_LABELS = ['Bk', 'Un', 'Tx', 'IM']
    const renderBlockEntry = (entry) => `
            <div id="block-${entry.raw.number}" class="entry">
                <div class="entry-block">
                  <div style="background: ${entry.color}" class="color"><span>${entry.detail.type}</span></div>
                  <div class="detail">
                      <div class="type">${entry.detail.value}</div>
                      <div class="value">${entry.detail.name}</div>
                  </div>
                  <div class="stats">
                        <div class="eth-trans">${entry.detail.type !== UNCLE && 'Ether Transferred - '}</div>
                  </div>
                  <a href="${entry.link}" target="_blank" class="view">View ></a>
                </div>
                <div class="entry-details"></div>
            </div>`
    const renderTxEntry = (entry) => `<a href="${entry.link}" style="background: ${entry.color}" target="_blank" class="tx-item">${entry.detail.type}</a>`

    const parent = $('#stream #list')
    const hasParentBlock = id => document.getElementById(`block-${id}`)
    const getParentBlock = id => $(`#stream #list #block-${id} .entry-details`)
    const getPreviousBlockEl = number => $(`#block-${number - 1}`)
    const getFirstLoadedBlock = () => currentBlockNum - document.getElementById('list').children.length

    const addBlockEntry = entry => {

        const previousBlock = getPreviousBlockEl(entry.raw.number)
        const newBlock = new DataHandler(BLOCK).createDataObject({number: entry.raw.number})

        if (!previousBlock) {
            addStreamEntry(renderBlockEntry(newBlock))
        }
        $(previousBlock).before(renderBlockEntry(newBlock));
    }

    const addStreamEntry = (entryString) => {
        const entryHTML = $.parseHTML(entryString)
        parent.prepend(entryHTML)
    }
    const addStreamEntryAtId = async entry => {

        // Get id of block, then check if it exists yet, append if ready
        const blockNum = entry.raw.blockNumber ? entry.raw.blockNumber : entry.raw.number
        if (!hasParentBlock(blockNum)) {
            addStreamEntry(renderBlockEntry(new DataHandler(BLOCK).createDataObject({number: blockNum})))
        }
        const parentBlock = getParentBlock(blockNum)

        const entryHTML = $.parseHTML(renderTxEntry(entry))

        parentBlock.append(entryHTML)
    }

    const eventQueue = []
    const subscriptions = {}
    const blocks = {}
    let currentBlockNum;
    let count = 0

    const responseHandler = async (dataObject) => {
            setLoading(false)
            if([BLOCK, UNCLE].indexOf(dataObject.type) < 0) {
                console.log(`responseHandler.indexOf -> `, dataObject.type )
                if (dataObject.raw.blockNumber <  getFirstLoadedBlock()) return
                await addStreamEntryAtId(dataObject)
                if(count % 20 === 0) {
                    eventQueue.push(dataObject)
                }
            } else {
                launchFrom({x: getRandomInt(window.innerWidth  / 3, window.innerWidth  / 2), colorText: dataObject.color, explosionSize: 110})
                if (dataObject.type === BLOCK) {
                    currentBlockNum = dataObject.raw.number

                    if(!hasParentBlock(currentBlockNum)) {

                        addBlockEntry(dataObject)
                    }
                } else if (dataObject.type === UNCLE) {
                    addStreamEntry(renderBlockEntry(dataObject))
                }
            }
            count++
    }

    class DataHandler {
        constructor(type) {
            this.type = type
        }

        createDataObject(data) {
            return {
                type: this.type,
                color: TYPE_COLOR[this.type],
                detail: {
                    type: TYPE_LABELS[this.type],
                    name: TYPE_NAMES[this.type],
                    value: this.getValue(data),
                    ...(data.totalTxns && {totalTxns: data.totalTxns}),
                    ...(data.totalTokens && {totalTokens: data.totalTokens}),
                    totalEthTransferred: data.totalEthTransferred
                },
                link: this.getLink(data),
                raw: data
            }
        }
        getValue(data) {
            switch (this.type) {
                case BLOCK:
                case UNCLE: return parseInt(data.number).toLocaleString('en')
                case TXN: return data.hash
                case INTERNAL_MSG: return data.hash
                // case INTERNAL_MSG: return data.transactionHash
                // case..., etc.
            }
        }

        getLink(data) {
            switch (this.type) {
                case BLOCK: return 'https://amberdata.io/blocks/' + data.number
                case UNCLE: return 'https://amberdata.io/uncles/' + data.number
                case INTERNAL_MSG: return'https://amberdata.io/transactions/' + data.transactionHash
                case TXN: return'https://amberdata.io/transactions/' + data.hash
            }
        }

        getBlockNumber(data) {
            switch (this.type) {
                case BLOCK:
                case UNCLE: return data.number
                case INTERNAL_MSG:
                case TXN: return data.blockNumber
            }
        }
    }

    const getRandomInt = (min, max, _min = Math.ceil(min), _max = Math.floor(max) ) => Math.floor(Math.random() * (_max - _min)) + _min;

    const setLoading = (bool) => {
        const loader = $('.spinner')
        loader.css('opacity', bool ? '1' : '0')
        loader.css('visibility', bool ? 'visible' : 'hidden')
        loader.css('display', bool ? 'block' : 'none')
    }
}));
