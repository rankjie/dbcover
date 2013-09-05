logger        = require 'node-simple-logger'
sqlbuilder    = require 'squel'
_             = require 'lodash'
Q             = require 'q'
{toType}      = require './utils'

replace_char = '?'
prefix       = ':'

defaultTTL = 60

class QueryTable
  constructor: (table, db, cache, model, nameToField) ->
    @db          = db
    @cache       = cache
    @table       = table
    @model       = model if model
    @nameToField = nameToField

  # 只有model才有的方法
  find: (inputRawSQL, condition) ->
    # SELECT id,name,mail..... FROM users
    @_inputRawSQL = inputRawSQL
    @_condition = condition
    @_queryType = 'find'
    return @

  set: (args) ->
    @_args = args
    return @

  orderBy: (args, order) ->
    @_orderBy.push args
    _order     = if order.toUpperCase() is 'DESC' then false else true
    @_order.push _order
    return @

  first: ->
    @list 0, 1

  list: (offset, limit) ->
    @_offset = offset or 0
    @_limit = limit
    @query()

  save: (obj)->
    @_queryType         = 'insert'
    @_cacheData         = {}
    @_fieldsToInsert    = []
    for name, field of obj.$nameToField
      # 把数据存到cacheData，用于存入cache
      @_cacheData[name] = field.toDB obj[name]
      # 因为save之前可能数据已经更改过，所以更新一下field.val
      field.val = obj[name]
      # 数据存入fieldsToInsert，用于存入db
      @_fieldsToInsert.push
        column: field.column
        value : field.toDB(obj[name])

    @_cachekey = @cacheKey(obj)
    console.log 'cacheData: '+ JSON.stringify @_cacheData
    console.log 'cacheKey: ' + @_cachekey
    @query()

  update: (obj) ->
    @_queryType = 'update'
    @_fieldsToUpdate = []

    # 找出需要做update的数据
    for name, field of obj.$nameToField when obj[name] isnt field.val
      # 更新field.val为最新的值
      field.val = obj[name]
      @_fieldsToUpdate.push 
        column : field.column
        value  : field.toDB(obj[name])
    # 取出一会儿要从cache里删除的key
    @_cachekey = @cacheKey(obj)

    @query()

  delete: (obj)->
    @_queryType = 'delete'
    @pkStr = []
    for k in obj.$pks
      @pkStr.push k.fields[0] + ' = ' + obj[k.name]
    @query()

  toSQL: ->
    if @_queryType is 'find'
      sql = sqlbuilder.select().from(@table)
      for name, field of @nameToField
        sql = sql.field(field.column, name)

      if toType(@_inputRawSQL) is 'string'
        sql = sql.where(@_inputRawSQL)
      else if toType(@_inputRawSQL) is 'object'
        for k, v of @_inputRawSQL
          # 传入的参数
          # userId: 123
          # userId并不一定是column name，所以要转换一下
          sql = sql.where(@nameToField[k].column + '=' + @nameToField[k].toDB v)

      if @_orderBy? and @_orderBy.length > 0
        for f,i in @_orderBy
          sql = sql.order f, @_order[i]

      sql = sql.limit(@_limit) if @_limit
      sql = sql.offset(@_offset) if @_offset
    
    else if @_queryType is 'update'
      sql = sqlbuilder.update().table(@table)
      for f in @_fieldsToUpdate
        sql = sql.set f.column, f.value

    else if @_queryType is 'insert'
      sql = sqlbuilder.insert().into(@table)
      for f in @_fieldsToInsert
        sql = sql.set f.column, f.value

    # need fix!
    else if @_queryType is 'delete'
      sql = sqlbuilder.delete().from(@table)
      for str in @pkStr
        # 为什么indices的field是array？pk对应多个fields？
        sql = sql.where(str)

    if @_condition?
      for i in [0...sql.match(/\?/g).length] by 1
        sql = sql.substr(0, sql.indexOf replace_char) + "#{@_condition[i]}" + sql.substr(sql.indexOf(replace_char) + replace_char.length)
    else if @_args?
      for k, v of @_args
        sql = sql.replace prefix+k, "#{v}"


    console.log '最后的查询sql：'+sql.toString()
    return sql.toString()

  query: () ->
    self = @
    deferred = Q.defer()
    sql = self.toSQL()

    cacheToInstance = (data) ->
      # console.log data
      return dbToInstance JSON.parse data

    instanceToCache = (obj) ->
      # console.log obj.$cacheData
      return JSON.stringify obj.$cacheData

    dbToInstance = (rows) ->
      instances = []
      for row in rows
        for name, field of self.nameToField
          row[name] = field.fromDB row[name]
        instances.push self.model.new row
      return instances

    # select类型，返回
    if self._queryType is 'find'
      # 先从cache找
      self.cache.get sql, (err, data) ->
        # 出错
        deferred.reject err if err
        console.log 'cache查到了：'
        if _.isEmpty data then console.log '空的' else console.log data
        # cache没有
        if _.isEmpty(data)
          console.log '去DB查！'
          # 从db查
          self.db.query sql, (err, rows) ->
            if err
              deferred.reject err
              return deferred.promise
            self.cache.set sql, JSON.stringify(rows), (err, response) ->
              # 把data变成object再返回
              deferred.resolve dbToInstance rows
        # cache有的话
        else
          deferred.resolve cacheToInstance data[sql]


    # insert类型
    if self._queryType is 'insert'
      
      # 存入db
      self.db.query sql, (err, rows) ->
        deferred.reject err if err
        deferred.resolve null unless self.cache
        # 存入cache
        self.cache.set self._cachekey, JSON.stringify self._cacheData, defaultTTL, (err, response) ->
          deferred.reject err if err
          deferred.resolve null

    # update类型，更新完db后从cache里删除该对象数据
    if self._queryType is 'delete'
      self.db.query sql, (err, rows) ->
        deferred.reject err if err
        self.cache.del self._cachekey, (err, numberOfRowsDeleted) ->
          deferred.reject err if err
          deferred.resolve numberOfRowsDeleted

    if self._queryType is 'update'
      self.db.query sql, (err, rows) ->
        deferred.reject err if err
        # 从cache里删掉，以后要用的时候再取就是了
        self.cache.del self._cachekey, (err, response) ->
          deferred.reject err if err
          deferred.resolve null

    return deferred.promise
  cacheKey: (obj) ->
    key = "#{@table}:"
    for k in obj.$pks
      key += obj[k] + ':'
    return key.slice 0, -1

module.exports = QueryTable