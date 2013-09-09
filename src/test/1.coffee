{Model}      = require '../model'
{Observe}    = require '../model'
{Validators} = require '../validators'

Observe.define 'repo',
  name: 'mysql'
  provider:
    type: 'mysql'
    options:
      host: 'localhost'
      port: 3306
      user: 'root'
      password: '123123'
      database: 'test'
      connectionLimit: 4

Observe.define 'repo',
  name: 'pg'
  provider:
    type: 'postgresql'
    options:
      host: 'localhost'
      port: 5432
      user: 'jeremy'
      password: '123123'
      database: 'jeremy'


Observe.define 'cache',
  name: 'default'
  provider:
    type: 'redis'
    options:
      host: 'localhost'
      port: 6379

Observe.define 'cache',
  name: 'memcache'
  provider:
    type: 'memcache'
    options:
      host: 'localhost'
      port: 11212


User = new Model 
  meta:
    table: 'work'
    repo: 'mysql'   # default repo name is 'default'
    cache: 'memcache' # set to false to disable caching
    fields: [
      {name: 'userId',  type: 'string',   column:    'id', required: true, primkey: true}
      {name: 'name',    type: 'string',   validator: null}
      {name: 'age',     type: 'integer',  validator: new Validators.integer(1, 100)}
    ]
    indices: [
      {name: 'id',    fields: ['userId', 'age'], unique: true}
    ]

  sayHi: () ->
    console.log 'hi'


Weather = new Model
  meta:
    table: '天气'
    repo: 'pg'
    cache: 'memcache'
    fields: [
      {name: 'id', type: 'integer', column: 'id', primkey: true}
      {name: 'city', type: 'string', column: '城市'}
      {name: 'lowTemp', type: 'number', column: '最低气温'}
      {name: 'highTemp', type: 'number', column: '最高气温'}
      {name: 'rain', type: 'number', column: '降水量'}
      {name: 'date', type: 'timestamp', column: '日期'}
    ]


u = User.new 
  userId: 999
  name:   '00号测试人员'
  age:    20


# date = new Date()
# console.log  date.toISOString()

w = Weather.new
  id:   11
  city: '蘑菇囤儿4'
  lowTemp: '-19'
  highTemp: '27'
  rain: '200'
  date: new Date

w.city = '驻马店'

w.update()
.then (result)->
  console.log 're:'+result
, (err)->
  console.log err

# Weather.find(city: '蘑菇囤儿2').all()
# .then (result)->
#   result.delete()
#   .then (result)->
#     console.log result
#   , (err) ->
#     console.log err
# , (err)->
#   console.log err


# w.save()
# .then (result)->
#   console.log result
# , (err) ->
#   console.log err.toString()

# u.save()
# .then (result)->
#   console.log result
# , (err) ->
#   console.log err.toString()


# Weather.find(city: 'HangZhou').all()
# .then (result)->
#   console.log 'result----->'
#   console.log result
# , (err) ->
#   console.log 'error----->'
#   console.log err


# User.findByUserId(83)
# .then (u) ->
#   console.log '---------------------------'
#   console.log u
# , (err) ->
#   console.log err


# User.find(age__gt:98).all()
# .then (u) ->
#   console.log '---------------------------'
#   console.log u
# , (err) ->
#   console.log err

