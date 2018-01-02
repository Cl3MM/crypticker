const mongoose = require('mongoose')
const pluginConf = require('./conf')
const Instrument = require('../../models/instrument')
const options = {discriminatorKey: 'mkt'}

const poloniexSchema = new mongoose.Schema({
  change: Number,
  quoteVolume: Number,
  isFrozen: Number
}, options)

const poloniexInstrument = Instrument.discriminator(pluginConf.name, poloniexSchema)

module.exports = poloniexInstrument
