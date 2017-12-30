const mongoose = require('mongoose');
const Instrument = require('../models/instrument')

class MongoDb {
  constructor (opts = {}) {
    this.log = opts.log || console.log
    this.srv = process.env.MONGO_SRV || 'crypticker_db'
    this.port = process.env.MONGO_PORT || 27017
    this.dbName = process.env.MONGO_DB || 'crypticker'
    this.collection = opts.collection || process.env.MONGO_COLL || 'tickers'
    this.mongoUrl = `mongodb://${this.srv}:${this.port}/${this.dbName}`
    this.log(`will persist data to: ${this.mongoUrl}`)
    mongoose.connect(this.mongoUrl, {
      useMongoClient: true
    })
    this.db = mongoose.connection;
    this.db.on('error', console.error.bind(console, 'MongoDB connection error:'))

    return this
  }

  lastN (count = 100, skip = 0) {
    return Instrument
      .find()
      .skip(skip)
      .limit(count)
      .sort({time: -1})
      .exec()

    // return new Promise((resolve, reject) => {
    //   MongoClient.connect(this.mongoUrl, (err, db) => {
    //     if (err) {
    //       this.log(`[!] unable to connect to mongodb`, err)
    //       return reject(err)
    //     }
    //     const collection = db.collection(this.collection)
    //     collection.find().sort({time: -1}).skip(skip).limit(count).toArray((err, items) => {
    //       db.close()
    //       if (err) {
    //         return reject(err)
    //       }
    //       return resolve(items)
    //     })
    //   })
    // })
  }

  find (query) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.mongoUrl, (err, db) => {
        if (err) {
          this.log(`[!] unable to connect to mongodb`, err)
          return reject(err)
        }
        const collection = db.collection(this.collection)
        collection.find(query).toArray((err, items) => {
          db.close()
          if (err) {
            return reject(err)
          }
          return resolve(items)
        })
      })
    })
  }

  persistOne (data) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.mongoUrl, (err, db) => {
        if (err) {
          this.log(`[!] unable to connect to mongodb`, err)
          return reject(err)
        }
        const collection = db.collection(this.collection)
        collection.insertOne(data, (err, res) => {
          db.close()
          if (err) {
            this.log(`[!] an error occured while inserting data`, err)
            return reject(err)
          }
          // this.log(`[+] data persisted successfuly!`)
          return resolve(res)
        })
      })
    })
  }

  persistMany (data) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.mongoUrl, (err, db) => {
        if (err) {
          this.log(`[!] unable to connect to mongodb`, err)
          return reject(err)
        }
        const collection = db.collection(this.collection)
        collection.insertMany(data, (err, res) => {
          db.close()
          if (err) {
            this.log(`[!] an error occured while inserting data`, err)
            return reject(err)
          }
          // this.log(`[+] data persisted successfuly!`)
          return resolve(res)
        })
      })
    })
  }
}

module.exports = MongoDb
