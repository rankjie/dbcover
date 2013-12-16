# A Simple ORM Module
## !UNDER DEVELOPMENT!

## GO TO ISSUES TO SEE KNOWN BUGS.

Install:
`npm install dbcover`

Usage (in coffeescript):

```coffeescript

{Observe, Model, Validators}   = require 'dbcover'
# Require whatever validator you need.
# List of validators: integer, string, email, required

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
      {name: 'id', type: 'integer', auto: true, primkey: true}
      {name: 'userId',  type: 'string', column: 'user_id', required: true}
      {name: 'email',   type: 'string', validator: 'email'}
      {name: 'age',     type: 'integer', validator: new Validators.integer(10, 100)}
      {name: 'extra',   type: 'json'}
      {name: 'created', type: 'timestamp'}
      {name: 'examplePrimkey', type: 'string', primkey: true}
    ]
    # primkey(s) with one or more columns. remember to use the name you definded above, not the real column name.
    indices: [
      {name: 'pk',    fields: ['userId', 'age'], unique: true}
    ]

  sayHi: () ->
    console.log 'hi'

  rename: (name, id)->
    deferred = Q.defer()
    raw_sql = "UPDATE #{@$table} SET name = ?, updated_at='#{new Date}' WHERE id = ?"
    # You may use @$repo.query to make customized queries.
    # Use ? or :var instead of raw variables to avoid SQL injection.
    @$repo.query raw_sql, [name, id], (err, result)->
      deferred.reject err if err?
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
# All promises returned by Query or findBy, will be resolved with a set of instances ( first()/findByIndeices will return just one object )
# Or, rejected with errors.
promise = User.find(userId: 123).first()
# You can append '__gt' or '__lt' to the field name, that would equals to '>' and '<'
promise = User.find(age: 30, created__gt: 2334343).first()
promise = User.find(age__lt: 30, created: 2334343).first()
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