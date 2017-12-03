const path = require('path')
const userAgent = "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:28.0) Gecko/20100101 Firefox/28.0"
const puppeteer = require('puppeteer')

class GoBrowseYourself {
  constructor() {
    this.page = null
    this.browser = null
    this.trs = null
    return this
  }
  init() {
    return puppeteer.launch({
        headless: false,
        // slowMo: 250
      })
      .then(async b => {
        this.browser = b
        this.page = await this.browser.newPage()
        await this.page.setUserAgent(userAgent)
        await this.page.setViewport({
          width: 1280,
          height: 8000
        })
        this.page.on('console', msg => {
          if (msg.text) {
            console.log('[chrome] ' + msg.text)
          }
        })
        this.page.on('error', msg => console.log('PAGE ERROR:', ...msg.args))
      })
  }
  go() {
    return this.page
      .goto('https://bitinfocharts.com/cryptocurrency-exchange-rates/#EUR', {
        waitUntil: 'networkidle2'
      })
  }
  async hoverAll() {
    console.log('hovering')
    const trs = await this.page.$$('tr.ptr')
    const aWindowHandler = await this.page.evaluateHandle(() => Promise.resolve(window));
    return this.page.evaluate(async (w) => {
      console.log('evaluating')
      Object.defineProperties(navigator, {
        languages: {
          description: 'en-us'
        },
        plugins: {
          value: ['adBlock'],
          writable: true
        }
      });
      const $ = w.$
      const o = {}
      $('tr.ptr').each(function () {
        $(this).trigger('mouseover')
        $('.popover-content table tr:not(:first)').each(function () {
          if ($(this).find('td').length < 4) return
          var buy = $(this).find('td.smlr:first').text()
          var sell = $(this).find('td.smlr:last').text()
          var mkt = $(this).find('td:nth-child(2) a').text()
          var inst = $(this).find('td:first a').text()
          if (o[mkt]) {
            o[mkt].push({
              inst: inst,
              buy: buy,
              sell: sell
            })
          } else {
            o[mkt] = [{
              inst: inst,
              buy: buy,
              sell: sell
            }]
          }
        })
      })
      return o
    }, aWindowHandler)
  }
  exit() {
    return this.browser.close()
  }
}

const pp = new GoBrowseYourself()
pp.init()
  .then(pp.go.bind(pp))
  .then(pp.hoverAll.bind(pp))
  .then(async (o) => {
    await pp.page.screenshot({
      path: path.join(__dirname, 'screens', 'exit.png')
    })
    const keys = Object.keys(o)
    const re = new RegExp(/^(.*) \w+$/i)
    keys.forEach((k) => {
      o[k].forEach((mkt) => {
        mkt.buy = mkt.buy.match(re) ? mkt.buy.match(re)[1].replace(',', '') : mkt.buy
        mkt.sell = mkt.sell.match(re) ? mkt.sell.match(re)[1].replace(',', '') : mkt.sell
        console.log(`| ${k} | ${mkt.inst} | ${mkt.buy} | ${mkt.sell} |`)
      })
    })
  })
  .then(pp.exit.bind(pp))
  .catch((e) => {
    console.log('ERROR')
    console.log(e)
    if (pp) pp.exit()
  })
