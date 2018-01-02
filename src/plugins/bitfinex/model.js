const mongoose = require('mongoose')
const pluginConf = require('./conf')
const Instrument = require('../../models/instrument')
const options = {discriminatorKey: 'mkt'}

const bitfinexSchema = new mongoose.Schema({
  changeDay: Number,
}, options)

const BitfinexInstrument = Instrument.discriminator(pluginConf.name, bitfinexSchema)

module.exports = BitfinexInstrument
