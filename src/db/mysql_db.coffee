_mysql = require 'mysql'

prefix = ':'

class MySQL
  constructor: (config) ->
    @pool = _mysql.createPool config
  
  query: (sql, args, callback) ->
    @pool.getConnection (err, connection)->
      if err
        console.log '[dbcover] Error when getting MySQL connection:'+err
      if Object.prototype.toString.call(args) == '[object Array]'
        console.log '[dbcover]', sql
        console.log '[dbcover]', args
        connection.query sql, args, (err, rows) ->
          connection.release()
          callback err, rows
      else if Object.prototype.toString.call(args) == '[object Object]'
        for k, v of args
          sql = sql.replace prefix+k, "'#{v}'"
        console.log '[dbcover]', sql
        console.log '[dbcover]', args
        connection.query sql, (err, rows)->
          connection.release()
          callback err, rows
      else
        callback = args if not callback?
        console.log '[dbcover]', sql
        connection.query sql, (err, rows)->
          connection.release()
          callback err, rows

  end: ()->
    @pool.end()



module.exports = MySQL