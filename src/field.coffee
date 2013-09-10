{toType} = require './utils'

class Field
  constructor: (attrs) ->
    @name = attrs.name
    @column = attrs.column ? @name
    @validator = attrs.validator ? null
    @required = attrs.required ? false
    @primkey  = attrs.primkey ? false
    @wait     = attrs.wait ? false

  say: ->
    console.log '喵'

fieldTypes = {}

fieldTypes['integer'] = class IntegerField extends Field
  toDB: (val) ->
    return val

  fromDB: (val) ->
    return val

  defaultValue: ->
    return 0

fieldTypes['number'] = class NumberField extends Field
  toDB: (val) ->
    return val

  fromDB: (val) ->
    return val

  defaultValue: ->
    return 0

fieldTypes['string'] = class StringField extends Field
  toDB: (val) ->
    return val

  fromDB: (val) ->
    return val

  defaultValue: ->
    return ''

fieldTypes['timestamp'] = class TimestampField extends Field
  toDB: (val) ->
    if not val?
      return null
    return (new Date(val)).toISOString()

  fromDB: (val) ->
    if not val?
      return val;
    try
      return new Date val
    catch e
      return null

fieldTypes['json'] = class JSONField extends Field
  toDB: (val) ->
    return JSON.stringify val
  
  fromDB: (val) ->
    if not val?
      return val
    try
      return JSON.parse val.toString()
    catch e
      return null

  defaultValue: ->
    return {}


createField = (define) ->
  FieldType = fieldTypes[define.type] or Field
  return new FieldType define

exports.createField = createField