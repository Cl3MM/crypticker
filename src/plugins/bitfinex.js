const Pluggin = require('./base')
const Instrument = require('./inst')
const { DateTime } = require('luxon')
const axios = require('axios')
const WebSocket = require('uws')

const __NAME__ = "bitfinex"
const __VERSION__ = "0.2"
const __WS_URL = 'wss://api.bitfinex.com/ws/2'

let isRunning = false
let interval = null

const log = (data) => console.log(JSON.stringify(data))

module.exports = class BitFinex extends Pluggin {
  constructor (opts = {}) {
    super({
      name: __NAME__,
      version: __VERSION__
    })
    this.dbCallback = opts.dbCallback
    this.log = opts.log || log
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
    this.log('getting currencies...')
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

  run () {
    if (!this.currencies[0]) {
      return this.getCurrencies().then(this.run.bind(this))
    }
    this.ws = new WebSocket(__WS_URL)

    this.ws.on('close', (msg) => {
      this.log('CLOSED')
      this.log(msg)
    })
    this.ws.on('error', (msg) => {
      this.log('ERROR')
      this.log(msg)
    })
    this.ws.on('open', () => {
      this.log('connected')
      this.isRunning = true
      // if (interval) {
      //   clearInterval(interval)
      // }
      this.subscribe()
    })

    this.ping()

    this.ws.on('message', this.processTicker.bind(this))

    return Promise.resolve(this)
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
      const ts = DateTime.utc()
      this.persistToDb(ts, cur, data[1])
    } else {
      this.log(data)
    }
  }

  persistToDb (ts, cur, data) {
    if (data.length != 10) {
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
    const inst = new Instrument({
      exchange: this.name,
      cur: cur.cur,
      time: ts,
      bid: data[0],
      bidSize: data[1],
      ask: data[2],
      askSize: data[3],
      price: data[6],
      volume: data[7],
      high: data[8],
      low: data[9]
    })

    if (this.dbCallback) {
      this.dbCallback(inst)
    } else {
      this.log(inst)
    }
    // this.log(`[${ts.toFormat('dd/LL/yyyy HH:mm:ss')}] ${cur.cur}: ${JSON.stringify(data)}`)
  }
}
