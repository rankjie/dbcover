{toType}  = require './utils'
{check}   = require 'validator'

Validators = {}
Validators.integer = class IntegerValidator
  constructor: (min, max)->
    @result = {}
    @min = min
    @max = max

  doValidate: (num)->
    try
      check(num).isInt().max(@max).min(@min)
    catch e
      @result.error = e
    return @result

Validators.string = class StringValidator
  constructor: (minx, max) ->
    @result = {}
    @min = min
    @max = max

  doValidate: (str)->
    try
      check(num).len(@min, @max)
    catch e
      @result.error = e.message
    return @result

Validators.email = class EmailValidator
  constructor: ->
    @result = {}

  doValidate: (str)->
    try
      check(str).isEmail()
    catch e
      @result.error = e
    return @result
      
Validators.required = class NullValidator
  constructor: ->
    @result = {}

  doValidate: (str)->
    try
      check(str).notNull()
    catch e
      @result.error = e
    return @result
    

exports.Validators       = Validators
exports.IntegerValidator = IntegerValidator
exports.StringValidator  = StringValidator
exports.EmailValidator   = EmailValidator