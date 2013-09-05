{toType}  = require './utils'
{check}   = require 'validator'


class Validator
   constructor: ->
     @result = {}

Validators = {}
Validators.integer = class IntegerValidator extends Validator
  constructor: (min, max)->
    @min = min
    @max = max

  doValidate: (num)->
    try
      check(num).isInt().max(@max).min(@min)
      @result.okay = true
    catch e
      @result.error = e
    return @result

Validators.string = class StringValidator extends Validator
  constructor: (minx, max) ->
    @min = min
    @max = max

  doValidate: (str)->
    try
      check(num).len(@min, @max)
      @result.okay = true
    catch e
      @result.error = e
    return @result

Validators.email = class EmailValidator extends Validator
  constructor: ->

  doValidate: (str)->
    try
      check(str).isEmail()
      @result.okay = true
    catch e
      @result.error = e
    return @result
      

Validators.required = class NullValidator extends Validator
  constructor: ->

  doValidate: (str)->
    try
      check(str).isNull()
      @result.okay = true
    catch e
      @result.error = e
    return @result
    

exports.Validators       = Validators
exports.IntegerValidator = IntegerValidator
exports.StringValidator  = StringValidator
exports.EmailValidator   = EmailValidator