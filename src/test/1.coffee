{Model}      = require '../model'
{Observe}    = require '../model'
{Validators} = require '../model'
Q            = require 'q'

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
    cache: 'redis' # set to false to disable caching
    fields: [
      {name: 'userId',  type: 'string',   column:    'id', required: true, primkey: true}
      {name: 'name',    type: 'string',   validator: null}
      # {name: 'email',   type: 'string',   validator: new Validators.email}
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
    cache: 'redis'
    fields: [
      {name: 'id', type: 'integer', column: 'id', primkey: true}
      {name: 'city', type: 'string', column: '城市'}
      {name: 'lowTemp', type: 'number', column: '最低气温'}
      {name: 'highTemp', type: 'number', column: '最高气温'}
      {name: 'rain', type: 'number', column: '降水量'}
      {name: 'date', type: 'timestamp', column: '日期'}
    ]

# p = Q.all [
#   User.find(age__gt: 99).all()
#   User.find(age__lt: 20).all()
#   User.find(age__gt: 20).all()
# ]


User.find(
  userId__gt: 990
).all()
.then (result)->
  console.log result
.fail (err)->
  console.log 'yep'+err

# UpUser = new Model
#   meta:
#     table: 'upcloud_user'
#     repo: 'mysql'
#     cache: 'redis'
#     fields: [
#       {name: 'id', type: 'integer', primkey: true, wait: true}
#       {name: 'email', type: 'string', validator: new Validators.email }
#       {name: 'password', type: 'string', required: 'true'}
#       {name: 'created_at', type: 'timestamp'}
#       {name: 'updated_at', type: 'timestamp'}
#     ]


# time = new Date

# u = UpUser.new
#   email     : 'rankjie@gmail.com'
#   password  : '405d3b8e375466aadad099d7ab5ab1cc'
#   created_at: time
#   updated_at: time

# u.save()
# .then (re)->
#   console.log re
#   console.log u
# , (err)->
#   console.log err



# u = User.new 
#   # userId: 990
#   name:   '02号测试人员'
#   email:  '1@a.cn'
#   age:    20

# u.save()
# .then (re)->
#   console.log  re
# , (err)->
#   console.log err

# date = new Date()
# console.log  date.toISOString()

# w = Weather.new
#   id:   11
#   city: '蘑菇囤儿4'
#   lowTemp: '-19'
#   highTemp: '27'
#   rain: '200'
#   date: new Date

# Weather.find('城市 = :city and 降水量 > :rain')
# .set(city: '驻马店', rain: 199).all()
# .then (result)->
#   console.log result
# , (err)->
#   console.log err

# w.city = '驻马店'

# w.update()
# .then (result)->
#   console.log 're:'+result
# , (err)->
#   console.log err

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

