const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const Primus = require('primus')
const app = express()

const port = process.env.PORT || 3000
app.set('view engine', 'pug')
app.set('views', './views')
app.use('/public', express.static('public'))

const server = require('http').createServer(app)
const primus = new Primus(server)
primus.save(path.join(__dirname, 'public', 'js', 'primus.js'))
const cryptoRoom = 'cryptos'

primus.on('connection', (spark) => {
  console.log('connection was made from', spark.address)
  console.log('connection id', spark.id)

  spark.on('data', (data) => {
    console.log(`received data from ${spark.id}`)

    data = data || {}
    const room = data.room
    if (room) {
      console.log(`broadcasting to room ${room}`)
      primus.forEach((spk, id, connections) => {
        if (spark.id !== id) {
          spk.write(data.data);
        }
      })
    }
  })
})
primus.on('disconnection', (spark) => {
  console.log('client disconnected')
})

app.get('/', (req, res) => {
  res.render('index', {
    title: 'Hey',
    message: 'Hello there!'
  })
})

server.listen(port, () => {
  console.log('[+] server is listening on port ' + port)
})
