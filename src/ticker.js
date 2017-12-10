// require('babel-polyfill')
const Promise = require('bluebird')
const chromium = require('chromium')
const moment = require('moment')
const Primus = require('primus')
const WS_NAME = process.env.WS_NAME || '127.0.0.1'
const WS_PORT = process.env.WS_PORT || 7918
const ws = `ws://${WS_NAME}:${WS_PORT}`
const Socket = Primus.createSocket()
const client = new Socket(ws)

// c o nst CHROME_PATH = '/usr/bin/chromium-browser'
// process.env.CHROME_PATH = CHROME_PATH
// console.log(CHROME_PATH)
// c o ns t path = require('path')
process.env.PHANTOMJS_EXECUTABLE = '/usr/local/bin/phantomjs'
console.log(process.env.PHANTOMJS_EXECUTABLE)
process.env.CHROME_PATH = chromium.path
process.env.NICKJS_NO_SANDBOX = 1
console.log(chromium.path)

const Nick = require("nickjs")
const nick = new Nick({
//  printNavigation: false,
})
console.log('[+] Nick OK')
const goGetACrypt = async () => {
  console.log('[+] starting new tab...')
  const tab = await nick.newTab()
  console.log('[+] opening bitinfocharts...')
  await tab.open('https://bitinfocharts.com/cryptocurrency-exchange-rates/#EUR')
  await tab.untilVisible("tr.ptr")
  console.log('[+] evaluating...')
  return tab.evaluate((arg, callback) => {
      const ar = []
      $('tr.ptr').each(function () {
        $(this).trigger('mouseover')
        $('.popover-content table tr:not(:first)').each(function () {
          if ($(this).find('td').length < 4) return
          var buy = $(this).find('td.smlr:first').text()
          var sell = $(this).find('td.smlr:last').text()
          var mkt = $(this).find('td:nth-child(2) a').text()
          var inst = $(this).find('td:first a').text()
          ar.push({
            mkt: mkt,
            inst: inst,
            buy: buy,
            sell: sell
          })
        })
      })
      callback(null, ar)
    })
    .then((data) => {
      if (!data || !data[0]) {
        console.log(`no results found`)
        nick.exit()
        return
      }
      const re = new RegExp(/^(.*) \w+$/i)
      const now = moment.utc()
      const cryptos = data.map((mkt) => {
        mkt.buy = mkt.buy.match(re) ? mkt.buy.match(re)[1].replace(',', '') : mkt.buy
        mkt.sell = mkt.sell.match(re) ? mkt.sell.match(re)[1].replace(',', '') : mkt.sell
        mkt.time = now.toISOString()
        return mkt
      })
      console.log(`[+] found ${data.length} data points`)
      client.write({
        action: 'tick',
        data: cryptos
      })
      nick.exit()
    })
}

goGetACrypt()
  .catch((err) => {
    console.log(`Something went terribly wrong: ${err}`)
    nick.exit(1)
  })
