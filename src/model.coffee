_                  = require 'lodash'
{toType}           = require './utils'
{createField}      = require './field'
db                 = require './db/db'
cache              = require './cache/cache'
Instance           = require './instance'
QueryTable         = require './querytable'
{StringValidator, IntegerValidator, EmailValidator}  = require './validators'

repoGroup  = {}
cacheGroup = {}

class Observe
  define: (cata, config)->
    repoGroup[config.name]  = db    config.provider if cata is 'repo'
    cacheGroup[config.name] = cache config.provider if cata is 'cache'

  getRepoAll: ->
    return repoGroup

  getCacheAll: ->
    return cacheGroup

  endRepoAll: ->
    for k, v of repoGroup
      v.end()

  endCacheAll: ->
    for k, v of cacheGroup
      v.end()

  endAll: ->
    @endCacheAll()
    @endRepoAll()
    
    

class Model
  # 生产Model
  # User = new Model
  constructor: (dataDefine) ->
    @$indices    = dataDefine.meta.indices
    @$table      = dataDefine.meta.table
    @$repo       = repoGroup[dataDefine.meta.repo] or repoGroup['default']

    @$cache      = false
    @$cache      = cacheGroup[dataDefine.meta.cache] or cacheGroup['default'] if dataDefine.meta.cache
    
    @$nameToField = {}
    for f in dataDefine.meta.fields
      @$nameToField[f.name] = createField _.cloneDeep f
      # 要把validator的prototype拷贝过去，因为cloneDeep不拷贝prototype
      # 这里是拷贝每个field所具备的toDB和fromDB等方法
      for k, v of Object.getPrototypeOf @$nameToField[f.name]
        @$nameToField[f.name][k] = v
      # 这里是拷贝validator的doValidate
      if f.validator
        for name, body of Object.getPrototypeOf f.validator
          @$nameToField[f.name].validator[name] = body

    # 用户自定义方法
    @$userDefineMethods = []
    for k, v of dataDefine
      if toType(v) is 'function'
        Model.prototype[k] = v
        @$userDefineMethods.push
          name: k
          body: v

    # 集合需要实现findBy的primkey
    @primkeys = []
    for f in dataDefine.meta.fields when f.primkey?
      key = f.name
      keyName = []
      keyName.push f.name

      @primkeys.push
        name   : f.name
        keyName: keyName

    for f in dataDefine.meta.indices
      if toType(f.fields) is 'array'
        keyName = f.fields
      else
        keyName = []
        keyName.push index.fields
      @primkeys.push
        name   : f.name
        keyName: keyName
    
    # 实现findByIndex
    for key in @primkeys
      Model.prototype['findBy_'+key.name] = (values) ->
        if toType(values) isnt 'object'
          values = {}
          values[key.name] = values
        sqlStr = []
        for name in key.keyName
          sqlStr.push "#{@$nameToField[name].column} = #{values[name]}"
        console.log 'findBy产生的sql条件：'+sqlStr.join(' AND ')
        return @find(sqlStr.join(' AND ')).first()
      
  # 生产instance
  # User.new
  new: (vals)->
    new Instance @$table, @$indices, @$nameToField, vals, @$repo, @$cache, @$userDefineMethods, @primkeys

  find: (rawSQL, condition) ->
    # 同new
    queryTable = new QueryTable @$table, @$repo, @$cache, @, @$nameToField
    # 传入的参数有三种情况：
    # 'age > ? and created > ?', [30, 234242]
    # 'age > :age and created > :created'
    # age: 30, created__gt: 2334343
    # 这些具体问题交给QueryTable处理
    queryTable.find(rawSQL, condition)



exports.Model   = Model
exports.Observe = new Observe