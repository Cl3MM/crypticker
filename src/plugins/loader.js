const Primus = require('primus')
const wSrv = process.env.WS_NAME || '127.0.0.1'// 'crypticker_srv'
const wPort = process.env.WS_PORT || 3000
const ws = `ws://${wSrv}:${wPort}`
const Socket = Primus.createSocket({ transformer: 'websockets', parser: 'EJSON' })
const client = new Socket(ws)
const fs = require('fs')
const path = require('path')

class PluginLoader {
  constructor (opts = {}) {
    this.plugins = []
    this.pluginsHash = {}

    return this
  }

  discoverPlugins () {
    const root = __dirname
    return fs.readdirSync(root)
      .filter(f => fs.statSync(path.join(root, f)).isDirectory())
  }

  load (opts = {}) {
    const pluginDirs = this.discoverPlugins()

    this.plugins = pluginDirs.map((dir) => {
      const klass = require(`../plugins/${dir.toLowerCase()}`)
      if (!klass || typeof(klass) !== 'function') return

      const plugin = new klass(opts)
      console.log(`plugin [${plugin.name}] registered`)
      if (this.pluginsHash[plugin.name]) {
        throw new Error(`plugin ${plugin.name} already registered...`)
      }
      this.pluginsHash[plugin.name] = plugin
      return plugin
    }).filter(x => x)

    return this
  }

  start () {
    return this.plugins.map((plugin) => {
      console.log(`starting plugin [${plugin.name}]`)
      return plugin.start()
    })
  }
}

module.exports = PluginLoader

// const plugins = new PluginLoader()
// Promise.all(plugins.load().run())
//   .catch((e) => {
//     console.log('Something went wrong...')
//     console.log(e)
//   })


