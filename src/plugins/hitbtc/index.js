const pluginConf = require('./conf')
const Model = require('./model')
const Plugin = require('../plugin')
const { DateTime } = require('luxon')
const axios = require('axios')
const WebSocket = require('ws')

const log = (data) => console.log(JSON.stringify(data))

class HitBtc extends Plugin {
  constructor (opts = {}) {
    super({
      name: pluginConf.name,
      version: pluginConf.version
    })
    this.symbols = []
    this.log = opts.log || log
    this.save = opts.save || this.log
    this.ws = null
    this.isRunning = false

    return this
  }

  randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
  }

  tmpl (symb) {
    const id = DateTime.local().valueOf() + this.randomIntInc(10, 10000)

    return {
      method: 'subscribeTicker',
      params: {
        symbol: symb,
      },
      id: id
    }
  }

  getSymbols () {
    return axios.get(`${pluginConf.restUrl}symbol`)
      .then(_ => this.symbols = _.data )
  }

  getCurrencies () {
    return axios.get(`${pluginConf.restUrl}currency`)
      .then(_ => this.currencies = _.data )
  }

  subscribe () {
    log('subscribing...')
    this.symbols.forEach(c => this.ws.send(JSON.stringify(this.tmpl(c.id))))
  }

  ping () {
    this.ws.send(JSON.stringify({
      event: "ping"
    }))
  }

  start () {
    if (!this.currencies[0]) {
      log('getting currencies')
      return this.getCurrencies().then(this.start.bind(this))
    }

    if (!this.symbols[0]) {
      log('getting symbols')
      return this.getSymbols().then(this.start.bind(this))
    }

    return new Promise((resolve, reject) => {

      this.ws = new WebSocket(pluginConf.wsUrl)

      this.ws.on('close', (msg) => {
        this.log('CLOSED')
        this.log(msg)
        resolve(this)
        this.start()
      })

      this.ws.on('error', (msg) => {
        this.log('ERROR')
        this.log(msg)
        resolve(msg)
      })

      this.ws.on('open', () => {
        this.log('connected')
        this.ping()
        this.isRunning = true
        this.subscribe()
      })

      this.ws.on('message', this.processTicker.bind(this))
    })
  }

  processTicker (msg) {
    const data = JSON.parse(msg)

    if(data.method && data.method === 'ticker' || data.channel && data.channel === 'ticker') {

      const tick = data.method ? data.params : data.data
      tick.method = data.method ? 'subscribed' : 'update'

      this.transform(tick)
    } else {
      this.log('NOT A TICK')
      this.log(data)
    }
  }

  transform (tick) {
    // {
    //   "ask":"2.830842",
    //   "bid":"2.805214",
    //   "last":"2.820884",
    //   "open":"3.137585",
    //   "low":"2.701973",
    //   "high":"3.142933",
    //   "volume":"2927.59",
    //   "volumeQuote":"8679.85808156",
    //   "timestamp":"2018-01-02T11:48:57.443Z",
    //   "symbol":"BCHETH"
    // }

    const inst = {
      mkt: this.name,
      oCur: tick.symbol,
      cur: tick.symbol.toLowerCase(),
      time: tick.timestamp,
      bid: tick.bid,
      bidSize: null,
      ask: tick.ask,
      askSize: null,
      change: null,
      price: tick.last,
      volume: tick.volume,
      high: tick.high,
      low: tick.low,
    }

    this.save(new Model(inst))
  }
}

module.exports = HitBtc

// log('starting HITBTC ticker')
// const hit = new HitBtc()
// hit.start()

