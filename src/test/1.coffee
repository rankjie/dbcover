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


User = new Model 
  meta:
    table: 'work'
    repo: 'mysql'   # default repo name is 'default'
    cache: 'default' # set to false to disable caching
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

u = User.new 
  userId: 999
  name:   '00号测试人员'
  age:    20

u.save()
.then (result)->
  console.log result
, (err) ->
  console.log err.toString()


# User.findByUserId(83)
# .then (u) ->
#   console.log '---------------------------'
#   console.log u
# , (err) ->
#   console.log err


# User.find(age__gt:99).all()
# .then (u) ->
#   console.log '---------------------------'
#   console.log u
# , (err) ->
#   console.log err