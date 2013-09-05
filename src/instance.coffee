{toType}      = require './utils'
_             = require 'lodash'
{Validators}  = require './validators'
QueryTable    = require './querytable'

class Instance
  constructor: (table, pks, nameToField , vals, db, cache, userDefineMethods) ->
    # console.log arguments
    @$table       = table
    @$pks         = _.cloneDeep pks
    @$nameToField = _.cloneDeep nameToField
    @$db          = db
    @$cache       = cache


    for name, field of @$nameToField
      # 按照name把键值都存下来，只能透过name访问，不能直接用column来访问
      # 同时也把这个初始值存到field里面，update的时候就能用了
      field.val = @[name] = vals[name]

    # 添加用户定义的方法
    for method in userDefineMethods
      Instance.prototype[method.name] = method.body
  

  save: ->
    queryTable = new QueryTable @$table, @$db, @$cache, null, @$nameToField
    return queryTable.save(@) if @validate()

  update: ->
    queryTable = new QueryTable @$table, @$db, @$cache, null, @$nameToField
    return queryTable.update(@) if @validate()

  delete: ->
    queryTable = new QueryTable @$table, @$db, @$cache, null, @$nameToField
    return queryTable.delete @

  # indices(pks)要检查是否为空
  validate: ->
    for index in @$pks
      for name in index.fields
        return false if @[name] is null

    for name, field of @$nameToField
      return false if field.required and @[name] is null
      # validator是string的话。例如'email'
      if field.validator?
        if toType(field.validator) is 'string'
          return (new Validators field.validator ).doValidate @[name]
        else
          return field.validator.doValidate @[name]

    return true

module.exports = Instance