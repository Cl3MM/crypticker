const Pluggin = require('./base')
const Instrument = require('./inst')
const { DateTime } = require('luxon')
const PoloniexApi = require('poloniex-api-node');
const axios = require('axios')

const __NAME__ = "poloniex"
const __VERSION__ = "0.1"

const log = (data) => console.log(JSON.stringify(data))

class Poloniex extends Pluggin {
  constructor (opts = {}) {
    super({
      name: __NAME__,
      version: __VERSION__
    })
    this.dbCallback = opts.dbCallback
    this.log = opts.log || log
    this.connection = null

    this.getCurrencies()

    return this
  }

  run () {
    return new Promise((resolve, reject) => {
      this.connection = new PoloniexApi()

      this.connection.subscribe('ticker')

      this.connection.on('message', (channelName, data, seq) => {
        if (channelName === 'ticker') {
          this.persistToDb(data)
        }
      })

      this.connection.on('open', () => {
        this.log(`Poloniex WebSocket connection open`)
      })

      this.connection.on('close', (reason, details) => {
        this.log(`Poloniex WebSocket connection disconnected`)
      });

      this.connection.on('error', (error) => {
        this.log(`An error has occured on Poloniex websocket`)
        this.log(error)
        reject(error)
      })

      this.connection.openWebSocket({ version: 2 });
    })
  }

  getCurrencies () {
    return axios.get('https://poloniex.com/public?command=returnCurrencies')
      .then(_ => (this.currencies = _.data), this)
  }

  persistToDb (tick) {
    // {
    //     "currencyPair":"ETH_CVC",
    //     "last":"0.00075422",
    //     "lowestAsk":"0.00076823",
    //     "highestBid":"0.00075301",
    //     "percentChange":"0.02233849",
    //     "baseVolume":"343.33693244",
    //     "quoteVolume":"460111.29846877",
    //     "isFrozen":0,
    //     "24hrHigh":"0.00081986",
    //     "24hrLow":"0.00068667"
    // }

    const inst = new Instrument({
      exchange: this.name,
      cur: tick.currencyPair.toLowerCase().replace('_', ''),
      time: DateTime.utc(),
      bid: tick.highestBid,
      ask: tick.lowestAsk,
      price: tick.last,
      change: tick.percentChange,
      volume: tick.baseVolume,
      quoteVolume: tick.quoteVolume,
      isFrozen: tick.isFrozen,
      high: tick['24hrHigh'],
      low: tick['24hrLow']
    })

    if (this.dbCallback) {
      this.dbCallback(inst)
    } else {
      this.log(inst)
    }
  }
}

module.exports = Poloniex
