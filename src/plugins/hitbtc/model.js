const mongoose = require('mongoose')
const pluginConf = require('./conf')
const Instrument = require('../../models/instrument')
const options = {discriminatorKey: 'mkt'}

const hitBtcSchema = new mongoose.Schema({
  last: Number,
  quoteVolume: Number,
}, options)

const hitBtcInstrument = Instrument.discriminator(pluginConf.name, hitBtcSchema)

module.exports = hitBtcInstrument
