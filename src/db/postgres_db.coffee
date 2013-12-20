pg     = require 'pg'

replace_char = '?'
prefix = ':'

class Postgres
  constructor: (config) ->
    @pool = pg.pools.getOrCreate config

  query: (sql, args, callback) ->
    console.log '[dbcover]', args
    replaceAll = (find, replace, str) ->
      str.replace(new RegExp(find, 'g'), replace);
    if Object.prototype.toString.call(args) is '[object Array]'
      for i in [0...sql.match(/\?/g).length] by 1
        sql = sql.substr(0, sql.indexOf replace_char) + "'#{args[i]}'" + sql.substr(sql.indexOf(replace_char) + replace_char.length)
    else if Object.prototype.toString.call(args) is '[object Object]'
      for k, v of args
        sql = sql.replace prefix+k, "'#{v}'"
    sql = replaceAll '`', '"', sql
    callback = args if not callback?
    console.log '[dbcover]', sql
    console.log '[dbcover]', args
    @pool.connect (err, client, done)->
      if err
        return console.error('[dbcover] Error when getting PostgreSQL connection', err)
      client.query sql, (err, rows)->
        done()
        return callback err, rows['rows'] ? rows

  end: ->
    pg.end()

module.exports = Postgres