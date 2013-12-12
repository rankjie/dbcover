# A Simple ORM Module
## !UNDER DEVELOPMENT!

Install:
`npm install dbcover`

Usage (in coffeescript):

```coffeescript

{Observe}          = require 'dbcover'
{Model}             = require 'dbcover'
# Require whatever validator you need. Full list of validators are in src/validators
{IntegerValidator}  = require('dbcover').Validator
# Or, require them all. Then, you can define a IntegerValidation with Validator.integer
# {Validator} = require('dbcover').Validator
# IntegerValidator = Validator.integer


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
    ttl: 10  # cache expire time(seconds), optional
    fields: [
      # set auto to true to support auto increment columns
      {name: 'id', type: 'integer', auto: true} 
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

  rename: (name, id)->
    deferred = Q.defer()
    raw_sql = "UPDATE #{@$table} SET name = ?, updated_at='#{(new Date).toISOString()}' WHERE id = ?"
    # You may use @$repo.query to make customized queries.
    # Use ? or :var instead of raw variables to avoid SQL injection.
    @$repo.query raw_sql, [name, id], (err, result)->
      if err
        deferred.reject err
      else
        deferred.resolve result
    return deferred.promise


# Creating instance
user = User.new
  userId: 23
  email: 'rankjie-nospam@gmail.com'
  age: 22

# Save instance 
promise = user.save()

# Updating attributes 
user.age = 23
user.extra = { nick: 'rankjie' }
promise = user.update()

# Deleting instance 
promise = user.delete()



# Query 
# All promises returned by Query or findBy, will be resolved with a set of instances
# Or, rejected with errors.
promise = User.find(userId: 123).first()
# You can append '__gt' or '__lt' to the field name, that equals to '>' and '<'
promise = User.find(age: 30, created__gt: 2334343).first()
promise = User.find(age: 30, created__lt: 2334343).first()
# Get all the entries
promise = User.find(age: 30).all()

# Find by primkeys 
promise = User.findByPk(userID: 234, age: 99)
promise = User.findByExamplePrimkey('someValue')


# list from 0 to 10
promise = User.find('age > ? and created > ?', [30, 234242])
  .orderBy('created', 'desc')
  .list(0, 10)

# get them all
promise = User.find('age > :age and created > :created')
  .set(age: 30, created: 1234324234)
  .orderBy('created', 'desc')
  .all()

# get the first one
promise = User.find('age > :age and created > :created')
  .set(age: 30, created: 1234324234)
  .orderBy('created', 'desc')
  .first()

```