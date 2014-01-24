{toType}  = require './utils'

Validators = {}
err_msg    = 'value check failed'

isInt = (n)-> 
  return toType(n) is 'number' and n%1 is 0

isString = (str)->
  return toType(str) is 'string'

isEmail  = (email)->
  re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email)

Validators.integer = class IntegerValidator
  constructor: (min, max)->
    @result = {}
    @min = min
    @max = max

  doValidate: (num)->
    @result.error = err_msg if not isInt(num) or num > @max or num < @min
    return @result

Validators.string = class StringValidator
  constructor: (minx, max) ->
    @result = {}
    @min = min
    @max = max

  doValidate: (str)->
    @result.error = err_msg if not isString(str) or str.length < @min or str.length > @max
    return @result

Validators.email = class EmailValidator
  constructor: ->
    @result = {}

  doValidate: (str)->
    @result.error = err_msg if not isEmail(str)
    return @result
      
Validators.required = class NullValidator
  constructor: ->
    @result = {}

  doValidate: (str)->
    @result.error = err_msg if not str?
    return @result
    

exports.Validators       = Validators
exports.IntegerValidator = IntegerValidator
exports.StringValidator  = StringValidator
exports.EmailValidator   = EmailValidator