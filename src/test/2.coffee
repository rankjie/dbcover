{check}   = require 'validator'

try
  check('ab123').len(2,3)
  console.log 'ababsd'
catch e
  console.log e
  # console.log

# {toType} = require '../utils'

# a  = ([].push 'asd').push 'aaaaa'
# console.log a
# console.log toType(a)