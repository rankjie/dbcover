{createField} = require './field'
_             = require 'lodash'
db            = require './db/db'
cache         = require './cache/cache'
Instance      = require './instance'
QueryTable    = require './querytable'
{toType}      = require './utils'

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

    # 实现findByIndex
    @$sql_findBy = {}
    for index in @$indices
      Model.prototype['findBy'+index.name] = Model.prototype['findBy'+index.fields] = (value) ->
        str = []
        for f, i in index.fields
          str.push "#{@$nameToField[f].column} = #{value[i]}"
        Model.prototype.find str.join(' AND ')


  # 生产instance
  # User.new
  new: (vals)->
    new Instance @$table, @$indices, @$nameToField, vals, @$repo, @$cache, @$userDefineMethods

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