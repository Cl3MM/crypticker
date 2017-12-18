const moment = require('moment')
const express = require('express')
const Primus = require('primus')
const http = require('http')
const MongoDb = require('./persistence')

module.exports = class Server {
  constructor (opts) {
    this.app = express()
    this.port = process.env.WS_PORT || 3000
    this.server = http.createServer(this.app)
    this.primus = new Primus(this.server, { transformer: 'uws' })

    this.db = {
      persist: (data) => {
        console.log(`FAKE PERSISTING DATA ${data.cur}`)
      }
    }//new MongoDb()
    return this
  }

  serve (req, res) {
    res.setHeader('Content-Type', 'text/json')
    res.write(`Crypticker is ticking ${moment.utc().toISOString()}`)
    res.end()
  }

  run () {
    this.primus.on('connection', (spark) => {
      spark.on('data', (data) => {
        if (data && data.action && data.action === 'tick') {
          console.log(`saving ${data.data.length} to mongo`)
          this.db.persist(data.data)
        }
      })
    })
    this.primus.on('disconnection', (spark) => {
      console.log('client disconnected')
    })

    this.server.listen(this.port, () => {
      console.log(`server is listening on port ${this.port}`)
    })

    return this
  }
}
