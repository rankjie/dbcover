{toType}      = require './utils'
_             = require 'lodash'
{Validators}  = require './validators'
QueryTable    = require './querytable'
Q             = require 'q'

class Instance
  constructor: (table, pks, nameToField , vals, db, cache, userDefineMethods, primkeys, ttl) ->
    # console.log arguments
    @$table       = table
    @$pks         = _.cloneDeep pks
    @$nameToField = _.cloneDeep nameToField
    @$db          = db
    @$cache       = cache
    @$primkeys    = primkeys
    @$ttl         = ttl
    
    for name, field of @$nameToField
      # 按照name把键值都存下来，只能透过name访问，不能直接用column来访问
      # 同时也把这个初始值存到field里面，update的时候就能用了
      @[name] = _.cloneDeep vals[name]
      field.val = _.cloneDeep vals[name]

    # 添加用户定义的方法
    for method in userDefineMethods
      Instance.prototype[method.name] = method.body
  
  save: ->
    queryTable = new QueryTable @$table, @$db, @$cache, null, @$nameToField, @$ttl
    validationResult = @validate()
    self = @
    unless validationResult.error?
      queryTable.save(@)
      .then (result)->
        Q(self)
      , (err)->
        Q.reject err
    else
      Q.reject validationResult.error

  update: ->
    queryTable = new QueryTable @$table, @$db, @$cache, null, @$nameToFieldm, @$ttl
    validationResult = @validate()
    unless validationResult.error?
      return queryTable.update(@)
    else
      console.log 'valid>>>>>>>', validationResult.error
      return Q.reject validationResult.error

  delete: ->
    queryTable = new QueryTable @$table, @$db, @$cache, null, @$nameToField, @$ttl
    return queryTable.delete(@)

  # indices(pks)要检查是否为空
  validate: ->
    result = {}
    if @$pks?
      for index in @$pks
        for name in index.fields when not @[name]?
          result.error = "Error: Field #{name}: is missing"
          # Error: ER_DUP_ENTRY: Duplicate entry '999' for key 'PRIMARY'
          return result
    for name, field of @$nameToField
      if (field.required or field.primkey) and not @[name]? and not field.auto
        result.error = "Error: Field #{name}: is missing"
        return result
      # validator是string的话。例如'email'
      if field.validator?
        if toType(field.validator) is 'string'
          re = new Validators[field.validator].doValidate @[name]
        else
          re = field.validator.doValidate @[name]
        result.error = "Error: Field #{name}: #{re.error}" if re.error
    return result

  getVals: ->
    vals = {}
    for name, field of @$nameToField
      vals[name] = @[name]
    return vals

  toJSON: ->
    return @getVals()
    

module.exports = Instance