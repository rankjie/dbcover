# class User
#   constructor: (byWhat)->
#     for key in byWhat

#       User.prototype[key] = ()->
        

# u = new User ['a','b']


# u.prototype.key()
cache = require '../cache/cache'

# cache

config = 
  type: 'memcache'
  options:
    host: 'localhost'
    port: 11212


ab = """SELECT id AS "userId", name AS "name", age AS "age" FROM work WHERE (age > '99')"""

console.log ab

console.log ab.replace(/\s+/g, '')

mem = cache config

# mem.get ab.replace(/\s+/g, ''), (err, res)->
#     console.log err
#     console.log res


mem.set ab.replace(/\s+/g, ''), '123123', 0, (err, res)->
  console.log err
  console.log res
  mem.get ab.replace(/\s+/g, ''), (err, res)->
    console.log err
    console.log res