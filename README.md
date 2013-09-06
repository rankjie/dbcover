# A Simple ORM Module

Install:
`npm install dbcover`
(not done yet.)


Usage:

```coffeescript
{Obeserve}          = require 'dbcover'
{Model}             = require 'dbcover'
{IntegerValidator}  = require('dbcover').Validator

# Define database connection
Observe.define 'repo',
  name: 'default'
  provider:
    type: 'mysql'
    options:
      host: 'localhost'
      port: 3306
      password: '123123'
      user: 'root'
      database: 'test'
      
Observe.define 'repo',
  name: 'pg'
  provider:
    type: 'postgresql'
    options:
      host: 'localhost'
      port: 3306
      password: '123123'
      user: 'root'
      database: 'test'

Observe.define 'cache',
  name: 'default'
  provider:
    type: 'redis'
    options:
      host: 'localhost'
      port: 6379

# Define an model
User = new Model
  meta:
    table: 'users'
    repo: 'pg'   # default repo name is 'default'
    cache: 'default' # leave meta.cache blank or set it false to disable caching
    fields: [
      {name: 'userId',  type: 'string', column: 'user_id', required: true}
      {name: 'email',   type: 'string', validator: 'email'}
      {name: 'age',     type: 'integer', validator: new IntegerValidator(10, 100)}
      {name: 'extra',   type: 'json'}
      {name: 'created', type: 'timestamp'}
      {name: 'examplePrimkey', type: 'string', primkey: true}
    ]
    # indices could be blank as long as you specified primkey(s) inside fields
    indices: [
      {name: 'pk',    fields: ['userId', 'age'], unique: true}
      {name: 'email', fields: 'email', unique: true}
    ]
    
  sayHi: () ->
    console.log 'hi'

# Creating instance
user = User.new
  userId: 23
  email: 'zolazhou@gmail.com'
  age: 30

# Save instance [DONE]
promise = user.save()

# Updating attributes [DONE]
user.age = 31
user.extra = { nick: 'zola' }
promise = user.update()

# Deleting instance [DONE]
promise = user.delete()



# Query [NEED TEST]
# All promises returned by Query or findBy, will be resolved with a set of instances
# Or, rejected with errors.
promise = User.find(userId: 123).first()
promise = User.find(age: 30, created__gt: 2334343).first()
promise = User.find(age: 30).all()

# Find by primkeys [DONE]
promise = User.findByPk(userID: 234, age: 99)
promise = User.findByExamplePrimkey('someValue')



promise = User.find('age > ? and created > ?', [30, 234242])
  .orderBy('created', 'desc')
  .list(0, 10)

promise = User.find('age > :age and created > :created')
  .set(age: 30, created: 1234324234)
  .orderBy('created', 'desc')
  .list(0, 10)
```