{check}   = require 'validator'
pg        = require 'pg'

try
  check('ab123').len(2,3)
  console.log 'ababsd'
catch e
  console.log e



a= 
  name: 'papap'
  age:  123
for k, v of a
  console.log k
  console.log v

  # console.log

# {toType} = require '../utils'

# a  = ([].push 'asd').push 'aaaaa'
# console.log a
# console.log toType(a)