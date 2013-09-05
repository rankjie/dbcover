{toType} = require './utils'
Validators = {}

Validators['integer'] = class IntegerValidator
  constructor: (min, max)->
    @min = min
    @max = max

  doValidate: (num)->
    return true if num >= @min and num <=@max and toType(num) is 'number'
    return false

Validators['string'] = class StringValidator
  constructor: (minx, max) ->
    @min = min
    @max = max

  doValidate: (str)->
    return true if str.length >= @min and str.length <=@max and toType(str) is 'string'
    console.log 'string, 验证失败'
    return false

Validators['email'] = class EmailValidator
  constructor: ->

  doValidate: ->

exports.Validators = Validators