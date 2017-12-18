module.exports = class Instrument {
  constructor (opts) {
    const required = ['exchange', 'cur', 'time', 'bid', 'ask', 'volume', 'price', 'high', 'low']

    this.isValid = true

    required.forEach((r) => {
      if (!opts[r]) {
        this.isValid = false
        console.log(`required property not found: ${r}`)
      }
    })

    Object.assign(this, opts)
    return this
  }

  toJson (spaces = 0) {
    return JSON.stringify(this, null, spaces)
  }
}
