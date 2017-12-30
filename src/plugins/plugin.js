 class BasePlugin {
   constructor (opts) {
     const required = ['name', 'version']
     required.some( (p) => {
       if (!opts[p]) {
         throw new Error(`Unable to instanciate pluggins, missing required parameter ${p}`)
       }
       return true
     })
     this.currencies = []
     Object.assign(this, opts)
     return this
   }

   start () {
     throw new Error("start method not implemented")
   }
   stop () {
     throw new Error("stop method not implemented")
   }
   restart () {
     throw new Error("restart method not implemented")
   }
   getCurrencies () {
     throw new Error("not implemented")
   }

   tick () {
     throw new Error("not implemented")
   }

   persistToDb() {
     throw new Error("not implemented")
   }
 }

module.exports = BasePlugin
