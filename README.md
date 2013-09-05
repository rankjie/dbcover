# A Simple ORM Module
```coffeescript
# Define database connection
Discover.define 'repo',
  name: 'default'
  provider:
    type: 'mysql'
    options:
      host: 'localhost'
      port: 3306
      password: '123123'
      user: 'root'
      database: 'test'
      
Discover.define 'repo',
  name: 'pg'
  provider:
    type: 'postgresql'
    options:
      host: 'localhost'
      port: 3306
      password: '123123'
      user: 'root'
      database: 'test'

Discover.define 'cache',
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
      {name: 'age',     type: 'integer', validator: new Validators.integer(10, 100)}
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

promise = user.save()

# Updating attributes
user.age = 31
user.extra = { nick: 'zola' }
promise = user.update()

# Deleting instance
promise = user.delete()

# Query
promise = User.find(userId: 123).first()
promise = User.find(age: 30, created__gt: 2334343).first()

# Find by primkeys
promise = User.findBy_pk(userID: 234, age: 99)
promise = User.findBy_examplePrimkey('someValue')



promise = User.find('age > ? and created > ?', [30, 234242])
  .orderBy('created', 'desc')
  .list(0, 10)

promise = User.find('age > :age and created > :created')
  .set(age: 30, created: 1234324234)
  .orderBy('created', 'desc')
  .list(0, 10)
```