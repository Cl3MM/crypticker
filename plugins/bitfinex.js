const { DateTime } = require('luxon')
const axios = require('axios')
const WebSocket = require('uws')
const ws = new WebSocket('wss://api.bitfinex.com/ws/2')

const tmpl = {
  event: "subscribe",
  channel: "ticker",
  symbol: null
}
const log = (data) => console.log(JSON.stringify(data))
const persistToDb = (ts, cur, data) => {
  log(`[${ts.toFormat('dd/LL/yyyy HH:mm:ss')}] ${cur.cur}: ${JSON.stringify(data)}`)
}
const tick = (ws, CURR) => {
  console.log('connection opened')

  CURR.forEach(c => {
    tmpl.symbol = c.id
    // console.log(`connecting to ${c.id} ticker`)
    ws.send(JSON.stringify(tmpl))
  })
}
const ping = (ws) => {
  ws.send(JSON.stringify({
    event: "ping"
  }))
}
axios.get('https://api.bitfinex.com/v1/symbols')
  .then(_ => _.data.map(d => ({id: `t${d.toUpperCase()}`, cur: d})))
  // .then(_ => (console.log(_), _))
  .then(_ => {
    let CURR = _ //.slice(0, 2)

    ping(ws)
    ws.on('open', () => {
      console.log('connected')
      ping(ws)
      tick(ws, CURR)
    })

    ping(ws)

    ws.on('message', (msg) => {
      const data = JSON.parse(msg)
      if (data.event) {
        if (data.event !== 'subscribed') {
          console.log(msg)
          return
        }
        const symb = data.symbol
        let cur = CURR.find(c => c.id === symb)
        let idx = CURR.indexOf(cur)
        cur.channel = data.chanId
        CURR = [
          ...CURR.slice(0, idx),
          cur,
          ...CURR.slice(idx + 1)
        ]
        return
      }
      if (Array.isArray(data)) {
        if (data[1] && data[1] === 'hb') return
        let cur = CURR.find(c => c.channel === data[0])
        if (!cur) return
        // we got a valid tick!
        const ts = DateTime.utc()
        persistToDb(ts, cur, data[1])
      } else {
        console.log(JSON.stringify(data))
      }
    })
    ping(ws)
  })
