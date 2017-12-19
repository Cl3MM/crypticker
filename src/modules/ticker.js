const Primus = require('primus')
const wSrv = process.env.WS_NAME || '127.0.0.1'// 'crypticker_srv'
const wPort = process.env.WS_PORT || 3000
const ws = `ws://${wSrv}:${wPort}`
const Socket = Primus.createSocket({ transformer: 'websockets' })
const client = new Socket(ws)

console.log(`connecting to websocket server ${ws}`)

const dbCb = (inst) => {
  client.write({
    action: 'tick',
    data: inst
  })
}

const plugins = ['Bitfinex', 'Poloniex'].map((plugin) => {
  const klass = require(`../plugins/${plugin.toLowerCase()}`)
  if (!klass) return
  return new klass({
    dbCallback: dbCb
  })
}).filter(x => x)

Promise.all(plugins.map(p => p.run()))
  .catch((e) => {
    console.log('Something went wrong...')
    console.log(e)
  })

