const MongoClient = require('mongodb').MongoClient

module.exports = class MongoDb {
  constructor (opts = {}) {
    this.log = opts.log || console.log
    this.srv = process.env.MONGO_SRV || 'crypticker_db'
    this.port = process.env.MONGO_PORT || 27017
    this.db = process.env.MONGO_DB || 'crypticker'
    this.collection = process.env.MONGO_COLL || 'tickers'
    this.mongoUrl = `mongodb://${this.srv}:${this.port}/${this.db}`
    this.log(`will persist data to: ${this.mongoUrl}`)

    return this
  }

  find (query) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.mongoUrl, (err, db) => {
        if (err) {
          this.log(`[!] unable to connect to mongodb`, err)
          return reject(err)
        }
        const collection = db.collection(this.collection)
        collection.fin(query).toArray((err, items) => {
          db.close()
          if (err) {
            return reject(err)
          }
          return resolve(items)
        })
      })
    })
  }

  persist (data) {
    MongoClient.connect(this.mongoUrl, (err, db) => {
      if (err) {
        this.log(`[!] unable to connect to mongodb`, err)
        return
      }
      this.insertMany(db, data, (err, res) => {
        db.close()
        if (err) {
          this.log(`[!] an error occured while inserting data`, err)
          return
        }
        this.log(`[+] data persisted successfuly!`)
      })
    })
  }
  insertMany (db, data, callback) {
    const collection = db.collection(this.collection)
    return collection.insertMany(data, callback)
  }
}
