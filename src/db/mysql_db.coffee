_mysql = require 'mysql2/promise'
Q      = require 'q'
util   = require 'util'

prefix = ':'

class MySQL
  constructor: (config) ->
    # console.log config
    @pool = _mysql.createPool config
    # console.log @pool
    @debug = false

  query: (sql, args)=>
    self = @
    if @debug
      console.log '[dbcover]', sql
      console.log '[dbcover]', args
    if Object.prototype.toString.call(args) == '[object Array]'
      self.pool.execute sql, args
    else if Object.prototype.toString.call(args) == '[object Object]'
      for k, v of args
        sql = sql.replace prefix + k, connection.escape("`#{v}`")
      self.pool.execute sql
    else
      self.pool.execute sql

  end: ->
    @pool.end()

module.exports = MySQL