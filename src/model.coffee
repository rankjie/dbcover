_                  = require 'lodash'
{toType}           = require './utils'
{createField}      = require './field'
db                 = require './db/db'
cache              = require './cache/cache'
Instance           = require './instance'
QueryTable         = require './querytable'
{Validators, StringValidator, IntegerValidator, EmailValidator}  = require './validators'

repoGroup  = {}
cacheGroup = {}

defaultTTL = 60

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
    @$ttl        = dataDefine.meta.ttl ? defaultTTL
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

    if dataDefine.meta.indices?
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
    capitaliseFirstLetter = (str) ->
      return str.charAt(0).toUpperCase() + str.slice(1)

    self = @
    for key in @primkeys
      ( (key)->
          Model.prototype['findBy'+capitaliseFirstLetter(key.name)] = (v)->
            if toType(v) isnt 'object' then values[key.name] = v else values = v
            sqlStr = []
            for name in key.keyName
              sqlStr.push self.$nameToField[name].column + ' = ' + self.$nameToField[name].toDB values[name]
            return self.find(sqlStr.join(' AND ')).all()
      )(key)

  # 生产instance
  # User.new
  new: (vals)->
    new Instance @$table, @$indices, @$nameToField, vals, @$repo, @$cache, @$userDefineMethods, @primkeys, @$ttl

  find: (rawSQL, condition) ->
    # 同new
    queryTable = new QueryTable @$table, @$repo, @$cache, @, @$nameToField, @$ttl
    # 传入的参数有三种情况：
    # 'age > ? and created > ?', [30, 234242]
    # 'age > :age and created > :created'
    # age: 30, created__gt: 2334343
    # 这些具体问题交给QueryTable处理
    queryTable.find(rawSQL, condition)




exports.Model   = Model
exports.Observe = new Observe
exports.Validators = Validators