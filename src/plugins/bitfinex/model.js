const mongoose = require('mongoose')
const pluginConf = require('./conf')
const Instrument = require('../../models/instrument')
// const options = {discriminatorKey: 'kind'}
// const bitfinexSchema = new mongoose.Schema({
// }, options)
//
// const BitfinexInstrument = Instrument.discriminator(pluginConf.name, bitfinexSchema)

module.exports = Instrument
