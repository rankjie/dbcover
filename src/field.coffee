{toType} = require './utils'

class Field
  constructor: (attrs) ->
    @name      = attrs.name
    @column    = attrs.column ? @name
    @validator = attrs.validator ? null
    @required  = attrs.required ? false
    @primkey   = attrs.primkey ? false
    @auto      = attrs.auto ? false
    @uniq      = attrs.uniq ? false

  say: ->
    console.log '喵'

  toDB: (val) ->
    return val

  fromDB: (val) ->
    return val

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

fieldTypes['boolean'] = class StringField extends Field
  toDB: (val) ->
    if val is 'true' or val is true
      return 'true'
    else
      return 'false'

  fromDB: (val) ->
    if val is 'true' or val is true
      return true 
    else
      return false

  defaultValue: ->
    return null

fieldTypes['timestamp'] = class TimestampField extends Field
  toDB: (val) ->
    if not val?
      return val;
    try 
      return (new Date(val)).toISOString()
    catch e
      return null

  fromDB: (val) ->
    if not val?
      return val;
    try
      return (new Date(val))
    catch e
      return null

fieldTypes['json'] = class JSONField extends Field
  toDB: (val) ->
    return val if not val?
    return JSON.stringify val
  
  fromDB: (val) ->
    return val if not val?
    try 
      return JSON.parse val
    catch e
      return val

  defaultValue: ->
    return {}


createField = (define) ->
  FieldType = fieldTypes[define.type] or Field
  return new FieldType define

exports.createField = createField