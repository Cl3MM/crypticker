const Bitfinex = require('../plugins/bitfinex')
const Primus = require('primus')
const wSrv = process.env.WS_NAME || '127.0.0.1'// 'crypticker_srv'
const wPort = process.env.WS_PORT || 3000
const ws = 'ws://' + wSrv + ':' + wPort
const Socket = Primus.createSocket({ transformer: 'uws' })
const client = new Socket(ws)

console.log(`connecting to websocket server ${ws}`)

const dbCb = (inst) => {
  console.log(`gotz inst: ${inst.cur} (${inst.bid}, ${inst.ask})`)
  client.write({
    action: 'tick',
    data: inst
  })
}
const bit = new Bitfinex({
  dbCallback: dbCb
})

bit.run()

