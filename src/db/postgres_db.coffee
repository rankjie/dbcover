pg     = require 'pg'

replace_char = '?'
prefix = ':'

class Postgres
  constructor: (config) ->
    @pool = pg.pools.getOrCreate config

  query: (sql, args, callback) ->
    replaceAll = (find, replace, str) ->
      str.replace(new RegExp(find, 'g'), replace);
    if Object.prototype.toString.call(args) is '[object Array]'
      for i in [0...sql.match(/\?/g).length] by 1
        sql = sql.substr(0, sql.indexOf replace_char) + "'#{args[i]}'" + sql.substr(sql.indexOf(replace_char) + replace_char.length)
    else if Object.prototype.toString.call(args) is '[object Object]'
      for k, v of args
        sql = sql.replace prefix+k, "'#{v}'"
    sql = replaceAll '`', '"', sql
    console.log sql
    callback = args if callback is undefined or callback is null
    @pool.connect (err, client, done)->
      if err
        return console.error('error fetching client from pool', err)
      client.query sql, (err, rows)->
        done()
        console.log rows
        console.log err
        return callback err, rows.rows

  end: ->
    pg.end()

module.exports = Postgres