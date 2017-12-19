const { DateTime } = require('luxon')

class Instrument {
  constructor (opts) {
    const required = {
      exchange: null,
      cur: null,
      time: t => DateTime.fromISO(t).toJSDate(),
      bid: _ => parseFloat(_, 10),
      ask: _ => parseFloat(_, 10),
      volume: _ => parseFloat(_, 10),
      price: _ => parseFloat(_, 10),
      high: _ => parseFloat(_, 10),
      low: _ => parseFloat(_, 10),
    }

    const optionals = {
      change: _ => parseFloat(_, 10),
      quoteVolume: _ => parseFloat(_, 10),
      isFrozen: _ => parseInt(_),
    }

    if (opts.isValid) delete opts.isValid

    this.isValid = true

    Object.keys(required).forEach((r) => {
      if (!opts[r]) {
        this.isValid = false
        console.log(`required property not found: ${r}`)
        return
      }
      // process entry
      if (required[r]) {
        opts[r] = required[r](opts[r])
      }
    })

    Object.keys(optionals).forEach((r) => {
      if (required[r] && opts[r]) {
        opts[r] = required[r](opts[r])
      }
    })

    Object.assign(this, opts)

    return this
  }

  toJson (spaces = 0) {
    return JSON.stringify(this, null, spaces)
  }
}

module.exports = Instrument
