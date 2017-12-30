const pluginConf = require('./conf')
const Model = require('./model')
const Plugin = require('../plugin')
const { DateTime } = require('luxon')
const PoloniexApi = require('poloniex-api-node');
const axios = require('axios')

const log = (data) => console.log(JSON.stringify(data))

class Poloniex extends Plugin {
  constructor (opts = {}) {
    super({
      name: pluginConf.name,
      version: pluginConf.version
    })
    this.log = opts.log || log
    this.save = opts.save || this.log
    this.connection = null


    return this
  }

  start () {
    this.getCurrencies()

    return new Promise((resolve, reject) => {
      this.connection = new PoloniexApi()

      this.connection.subscribe('ticker')

      this.connection.on('message', (channelName, data, seq) => {
        if (channelName === 'ticker') {
          this.broadcast(data)
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
    return axios.get(pluginConf.currenciesUrl)
      .then(_ => (this.currencies = _.data), this)
  }

  broadcast (tick) {
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

    const inst = {
      mkt: this.name,
      ocur: tick.currencyPair,
      cur: tick.currencyPair.toLowerCase().replace('_', ''),
      time: DateTime.utc().toJSDate(),
      bid: tick.highestBid,
      ask: tick.lowestAsk,
      price: tick.last,
      change: tick.percentChange,
      volume: tick.baseVolume,
      quoteVolume: tick.quoteVolume,
      isFrozen: tick.isFrozen,
      high: tick['24hrHigh'],
      low: tick['24hrLow']
    }
    this.save(new Model(inst))
  }
}

module.exports = Poloniex
