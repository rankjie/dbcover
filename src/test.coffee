db = require './db/db'
cache = require './cache/cache'
sql = require 'squel'

mysql = db
  type: 'mysql'
  options:
    host: 'localhost'
    port: 3306
    user: 'root'
    password: '123123'
    database: 'test'
    connectionLimit: 4

pg = db
  type: 'postgresql'
  options:
    host: 'localhost'
    port: 5432
    user: 'jeremy'
    password: '123123'
    database: 'jeremy'


s1 = sql.select().from('work')
s2 = sql.select().from('天气')

redis = cache
  type: 'redis'
  options:
    host: 'localhost'
    port: 6379

console.log s1.toString()

mysql.query s1.toString(), (err, rows)->
  console.log JSON.stringify(rows)
  redis.set s1.toString(), JSON.stringify(rows), (err, response) ->
    console.log err
    console.log response
    
    redis.get s1.toString(), (err, response) ->
      console.log '\n\n\n\n\n\n\n\n\n\n'
      re = JSON.parse response[s1.toString()]
      console.log re[0]
      console.log '\n\n\n\n\n\n\n\n\n\n'
      console.log 'end mysql'
      mysql.end()
      redis.end()


console.log s2.toString()
pg.query s2.toString(), (err, rows)->
  console.log JSON.stringify rows
  console.log 'end pg'
  pg.end()


