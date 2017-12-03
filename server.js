const Primus = require('primus')
const port = process.env.WS_PORT || 3000
const MONGO_SRV = process.env.MONGO_SRV || 'crypticker_db'
const MONGO_PORT = process.env.MONGO_PORT || 27017
const MONGO_DB = process.env.MONGO_DB || 'crypticker'
const MONGO_COLL = process.env.MONGO_COLL || 'tickers'
const MONGO_URL = `mongodb://${MONGO_SRV}:${MONGO_PORT}/${MONGO_DB}`

const http = require('http')
const MongoClient = require('mongodb').MongoClient

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/json')
  res.write(`Crypticker is ticking ${moment.utc().toISOString()}`)
  res.end()
})
const primus = new Primus(server)

const insertDocuments = (db, data, callback) => {
  // Get the documents collection
  const collection = db.collection(MONGO_COLL)
  // Insert some documents
  return collection.insertMany(data, callback)
}

primus.on('connection', (spark) => {
  console.log('connection was made from', spark.address)
  spark.on('data', (data) => {
    if (data && data.action && data.action === 'tick') {
      console.log(`saving ${data.data.length} to mongo`)
      MongoClient.connect(MONGO_URL, (err, db) => {
        if (err) {
          console.log(`[!] unable to connect to mongodb`, err)
          return
        }
        insertDocuments(db, data.data, (err, res) => {
          db.close()
          if (err) {
            console.log(`[!] an error occured while inserting data`, err)
            return
          }
          console.log(`[+] data persisted successfuly!`)
        })
      })
    }
  })
})
primus.on('disconnection', (spark) => {
  console.log('client disconnected')
})

server.listen(port, () => {
  console.log(`server is listening on port ${port}`)
})
