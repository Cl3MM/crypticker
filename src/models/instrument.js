const mongoose = require('mongoose')
const options = {
  discriminatorKey: 'mkt',
  autoIndex: true
}

const instrumentSchema = new mongoose.Schema({
  mkt: { type: String, index: true },
  cur: { type: String, index: true },
  isoCur: String,
  oCur: String,
  time: { type: Date, index: true },
  bid: Number,
  ask: Number,
  volume: Number,
  price: Number,
  high: Number,
  low: Number,
}, options)

const Instrument = mongoose.model('Ticker', instrumentSchema)

module.exports = Instrument
