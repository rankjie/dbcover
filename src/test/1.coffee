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
      {name: 'userId',  type: 'string',   column:    'id', required: true}
      {name: 'name',    type: 'string',   validator: null}
      {name: 'age',     type: 'integer',  validator: new Validators.integer(1, 100)}
    ]
    indices: [
      {name: 'id',    fields: ['userId', 'age'], unique: true}
    ]

  sayHi: () ->
    console.log 'hi'

u = User.new 
  userId: 801
  name:   '二号测试人员'
  age:    98

u.sayHi()

promise = u.save()

u.age = 2

promise1 = u.delete()

# console.log u

# Observe.listAll()
# console.log u

# u.save()
# u.$cache.set 'abc', '123'


# Observe.endAll()

# console.log u