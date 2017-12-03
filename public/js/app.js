((w, $, Primus) => {
  $(() => {
    const cryptoRoom = 'cryptos'
    const log = (data) => {
      console.log('data received via ws')
      console.log(data)
      if ($.isPlainObject(data) || $.isArray(data)) {
        $('#log').append(JSON.stringify(data, null, 2))
      } else {
        $('#log').append(data)
      }
      $('#log').append('<br>')
    }
    const primus = Primus.connect('ws://127.0.0.1:3000')

    primus.on('data', (data) => {
      log(data)
    })
    primus.on('error', (err) => {
      console.error('Something horrible has happened', err.stack);
    })

    let quotes = []
    const broadcastQuote = () => {
      if (quotes[0]) {
        console.log('[+] broadcasting quote')
        primus.write({
          room: cryptoRoom,
          data: quotes[0]
        })
      }
    }

    const showQuote = (q) => {
      $("#quotes").append(q[0].content + "<p>&mdash; " + q[0].title + "</p>")
      return Promise.resolve(q)
    }

    const getQuotes = (max = 1) => {
      return $.getJSON(`https://quotesondesign.com/wp-json/posts?filter[orderby]=rand&filter[posts_per_page]=${max}&callback=`).then((q) => {
        console.log('[+] got quotes')
        quotes = q
        return Promise.resolve(q)
      })
    }

    $('#requote').on('click', broadcastQuote)
    getQuotes(1).then(showQuote)
    // setInterval(() => {
    //   getQuotes(1).then(showQuote)
    // }, 1000 * 10)
  })
})(window, window.jQuery, window.Primus)
