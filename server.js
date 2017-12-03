const Primus = require('primus')
const port = process.env.PORT || 3000
const http = require('http')
const MongoClient = require('mongodb').MongoClient
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/json')
  res.write('yolo')
  res.end()
})
const primus = new Primus(server)

const MONGO_URL = 'mongodb://localhost:27017/myproject'
const CRYPTO_COLLECTION = 'cryptos_prices'

const insertDocuments = (db, data, callback) => {
  // Get the documents collection
  const collection = db.collection(CRYPTO_COLLECTION)
  // Insert some documents
  collection.insertMany(data, callback)
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
