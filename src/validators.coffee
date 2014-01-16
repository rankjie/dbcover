{toType}  = require './utils'
validator = require 'validator'

Validators = {}
err_msg    = 'value check failed'

Validators.integer = class IntegerValidator
  constructor: (min, max)->
    @result = {}
    @min = min
    @max = max

  doValidate: (num)->
    @result.error = err_msg if not (validator.isInt(num) and Number(validator) <= @max and Number(validator) >= @min)
    return @result

Validators.string = class StringValidator
  constructor: (minx, max) ->
    @result = {}
    @min = min
    @max = max

  doValidate: (str)->
    @result.error = err_msg if not validator.isLength(str, @min, @max)
    return @result

Validators.email = class EmailValidator
  constructor: ->
    @result = {}

  doValidate: (str)->
    @result.error = err_msg if not validator.isEmail(str)
    return @result
      
Validators.required = class NullValidator
  constructor: ->
    @result = {}

  doValidate: (str)->
    @result.error = err_msg if not validator.isNull(str)
    return @result
    

exports.Validators       = Validators
exports.IntegerValidator = IntegerValidator
exports.StringValidator  = StringValidator
exports.EmailValidator   = EmailValidator