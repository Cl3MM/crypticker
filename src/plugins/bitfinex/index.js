const pluginConf = require('./conf')
const Model = require('./model')
const Plugin = require('../plugin')
const { DateTime } = require('luxon')
const axios = require('axios')
const WebSocket = require('ws')

const log = (data) => console.log(JSON.stringify(data))

class BitFinex extends Plugin {
  constructor (opts = {}) {
    super({
      name: pluginConf.name,
      version: pluginConf.version
    })
    this.log = opts.log || log
    this.save = opts.save || this.log
    this.ws = null
    this.isRunning = false

    return this
  }

  tmpl (symb) {
    return {
      event: "subscribe",
      channel: "ticker",
      symbol: symb
    }
  }

  getCurrencies () {
    return axios.get('https://api.bitfinex.com/v1/symbols')
      .then(_ => (this.currencies = _.data.map(d => ({id: `t${d.toUpperCase()}`, cur: d}))), this)
  }

  subscribe () {
    this.currencies.forEach(c => this.ws.send(JSON.stringify(this.tmpl(c.id))))
  }

  ping () {
    this.ws.send(JSON.stringify({
      event: "ping"
    }))
  }

  start () {
    if (!this.currencies[0]) {
      return this.getCurrencies().then(this.start.bind(this))
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
    if (data.event) {
      if (data.event !== 'subscribed') {
        this.log(msg)
        return
      }
      const symb = data.symbol
      let cur = this.currencies.find(c => c.id === symb)
      let idx = this.currencies.indexOf(cur)
      cur.channel = data.chanId
      this.currencies = [
        ...this.currencies.slice(0, idx),
        cur,
        ...this.currencies.slice(idx + 1)
      ]
      return
    }

    if (Array.isArray(data)) {
      if (data[1] && data[1] === 'hb') return
      let cur = this.currencies.find(c => c.channel === data[0])
      if (!cur) return

      // we got a valid tick!
      this.transform({
        cur: cur,
        data: data[1]
      })
      // this.broadcast(cur, data[1])
    } else {
      this.log(data)
    }
  }

  transform (opts) {
    if (!opts.data) {
      this.log(`data is missing`)
      return
    }
    if (opts.data.length != 10) {
      this.log(`wrong data length (${data.length})`)
      return
    }
/*
    CHANNEL_ID	integer	Channel ID
    BID	float	Price of last highest bid
    BID_SIZE	float	Size of the last highest bid
    ASK	float	Price of last lowest ask
    ASK_SIZE	float	Size of the last lowest ask
    DAILY_CHANGE	float	Amount that the last price has changed since yesterday
    DAILY_CHANGE_PERC	float	Amount that the price has changed expressed in percentage terms
    LAST_PRICE	float	Price of the last trade.
    VOLUME	float	Daily volume
    HIGH	float	Daily high
    LOW	float	Daily low
    */
    const inst = {
      mkt: this.name,
      oCur: opts.cur.id,
      cur: opts.cur.cur,
      time: DateTime.utc().toISO(),
      bid: opts.data[0],
      bidSize: opts.data[1],
      ask: opts.data[2],
      askSize: opts.data[3],
      change: opts.data[5],
      price: opts.data[6],
      volume: opts.data[7],
      high: opts.data[8],
      low: opts.data[9]
    }

    this.save(new Model(inst))
  }
}

module.exports = BitFinex
