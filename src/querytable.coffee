sqlbuilder    = require 'squel'
_             = require 'lodash'
Q             = require 'q'
{toType}      = require './utils'

replace_char = '?'
prefix       = ':'


class QueryTable
  constructor: (table, db, cache, model, nameToField, ttl) ->
    @db          = db
    @cache       = cache
    @table       = table
    @model       = model ? null
    @nameToField = nameToField
    @ttl         = ttl
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
    @_orderBy = []
    @_order   = []
    @_orderBy.push args
    _order     = if order.toUpperCase() is 'DESC' then false else true
    @_order.push _order
    return @

  all: ->
    @list 0, 0

  first: ->
    @_first = true
    @list 0, 1

  list: (offset, limit) ->
    @_offset = offset or 0
    @_limit = limit
    @query()

  save: (obj)->
    @_queryType         = 'insert'
    @_cacheData         = {}
    @_fieldsToInsert    = []
    @_auto              = []
    @_objToSave         = obj
    for name, field of obj.$nameToField
      # 如果有field需要等save之后才能获得（id），那就先不载入这个数组，并且记录下来，这样等下存完了就可以抓到完整放进cache
      if field.auto
        @_auto.push name
      else
        # 把数据存到cacheData，用于存入cache
        @_cacheData[name] = field.toDB obj[name]
        # 因为save之前可能数据已经更改过，所以更新一下field.val
        field.val = obj[name]
        # 数据存入fieldsToInsert，用于存入db
        @_fieldsToInsert.push
          column: field.column
          value : field.toDB(obj[name])

    @_cachekey = @cacheKey(obj)
    @query()

  update: (obj) ->
    @_queryType = 'update'
    @_fieldsToUpdate = []
    @pkStr = []
    for k in obj.$primkeys
      for name in k.keyName
        @pkStr.push obj.$nameToField[name].column + " = '" + obj.$nameToField[name].val + "'"
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
    for k in obj.$primkeys
      for name in k.keyName
        # 因为instance可能在delete之前有修改过变量值，但是没有update。这时候数据库的数据是老的，所以要用
        # nameToField里面存的变量（用于在update的时候找出需要做set的column）
        @pkStr.push obj.$nameToField[name].column + " = '" + obj.$nameToField[name].val + "'"
     
    @query()

  toSQL: ->
    if @_queryType is 'find'
      sql = sqlbuilder.select().from(@table)
      for name, field of @nameToField
        sql = sql.field(field.column, name)

      if not @_inputRawSQL? 
        sql = sql
      else if toType(@_inputRawSQL) is 'string'
        sql = sql.where(@_inputRawSQL)
      else if toType(@_inputRawSQL) is 'object'
        for k, v of @_inputRawSQL
          # 传入的参数
          # userId: 123  或者  userId__gt: 123
          # userId并不是column name，所以要转换一下
          operators = 
            '__gt' : ' > '
            '__lt' : ' < '
          opkey = k.slice(k.length-4, k.length)
          if opkey not in ['__gt', '__lt']
            operator = ' = '
            columnName = k
          else
            operator = operators[opkey]
            columnName = k.slice(0, k.length-4)
          sql = sql.where(@nameToField[columnName].column + operator + "'" + @nameToField[columnName].toDB(v) + "'")

      if @_orderBy? and @_orderBy.length > 0
        for f,i in @_orderBy
          sql = sql.order f, @_order[i]

      sql = sql.limit(@_limit) if @_limit? and @_limit isnt 0
      sql = sql.offset(@_offset) if @_offset?
    
    else if @_queryType is 'update'
      sql = sqlbuilder.update().table(@table)
      for f in @_fieldsToUpdate
        sql = sql.set f.column, f.value
      for str in @pkStr
        sql = sql.where(str)


    else if @_queryType is 'insert'
      sql = sqlbuilder.insert().into(@table)
      for f in @_fieldsToInsert
        # console.log f
        sql = sql.set f.column, f.value ? null

    else if @_queryType is 'delete'
      sql = sqlbuilder.delete().from(@table)
      for str in @pkStr
        sql = sql.where(str)



    # if @_condition?
    #   s = sql.toString()
    #   for i in [0...s.match(/\?/g).length] by 1
    #     console.log @_condition[i]
    #     s = s.substr(0, s.indexOf replace_char) + "#{@_condition[i]}" + s.substr(s.indexOf(replace_char) + replace_char.length)
    # else if @_args?
    #   for k, v of @_args
    #     s = s.replace prefix+k, "#{v}"


    # console.log '最后执行的sql：'+sql.toString()
    return sql.toString()

  # deferred.reject err if err 需要改一下。
  # 因为err了就不用后面的操作了，直接return吧
  query: () ->  
    self = @
    deferred = Q.defer()
    sql = self.toSQL()

    cacheToInstance = (rows) ->
      console.log '[dbcover] Found data in cache.'
      instances = []
      for row in JSON.parse rows
        for name, field of self.nameToField
          row[name] = field.fromDB row[name]
        instances.push self.model.new row
      return instances

    instanceToCache = (obj) ->
      # console.log obj.$cacheData
      return JSON.stringify obj.$cacheData

    dbToInstance = (rows) ->
      console.log '[dbcover] Load data from DB.'
      instances = []
      for row in rows
        for name, field of self.nameToField
          row[name] = field.fromDB row[name]
        instances.push self.model.new row
      return instances

    # select类型，返回
    if self._queryType is 'find'
      cacheKey = sql.replace(/\s+/g, '')
      # 看是否有cache定义
      if self.cache
        # console.log '有定义cache哦！'
        # console.log self
        # 先从cache找
        self.cache.get cacheKey, (err, data)->
          # 出错
          deferred.reject err if err
          # cache没有
          # memcached这里有个bug(?)，如果查不到对应的key，会返回一个很奇怪的对象（包含一个叫$family等的东西，所以这样粗糙hack一下）
          # need further fix
          if _.isEmpty(data) or data.$family?
            # console.log 'cache查到的是空的'
            # 从db查
            self.db.query sql, self._condition ? self._args, (err, rows) ->
              if err?
                # console.log 'db查的时候  出错了'
                deferred.reject err
              else
                if rows.length > 0
                  datas = dbToInstance rows
                  # 先把sql作为key，存入cache
                  self.cache.set cacheKey, JSON.stringify(rows), self.ttl, (err, response) ->
                    # 把每个查到的对象都存入cache
                    for obj in datas
                      self.cache.set self.cacheKey(obj), JSON.stringify(self.cacheDate(obj)), self.ttl
                    deferred.resolve if self._first then datas[0] else datas
                else
                  deferred.resolve null
          # cache有的话
          else
            d = cacheToInstance data[cacheKey]
            d = d[0] if self._first
            deferred.resolve d
      # 没设置cache的话
      else
        # 直接从db找
        self.db.query sql, self._condition ? self._args, (err, rows) ->
          if err?
            # console.log 'db查的时候  出错了'
            deferred.reject err
          else
            if rows.length > 0
              deferred.resolve dbToInstance rows
            else
              deferred.resolve dbToInstance rows


    # insert类型
    if self._queryType is 'insert'
      
      # 存入db
      self.db.query sql, (err, rows) ->
        if err
          deferred.reject err
          return deferred.promise

        # 取出auto的ID
        for name in self._auto
          self._objToSave[name] = rows.insertId
          self._cacheData[name] = self._objToSave.$nameToField[name].toDB self._objToSave[name]
        if self.cache
          # 存入cache
          self.cache.set self.cacheKey(self._objToSave), JSON.stringify(self._cacheData), self.ttl, (err, response) ->
            deferred.reject rows if err?
            deferred.resolve rows
        else
          deferred.resolve rows

    # update类型，更新完db后从cache里删除该对象数据
    if self._queryType is 'delete'
      self.db.query sql, (err, rows) ->
        deferred.reject err if err
        if self.cache
          self.cache.del self._cachekey, (err, numberOfRowsDeleted) ->
            deferred.reject err if err
            deferred.resolve true
        else
          deferred.resolve true

    if self._queryType is 'update'
      self.db.query sql, (err, rows) ->
        deferred.reject err if err
        if self.cache
          # 从cache里删掉，以后要用的时候再取就是了
          self.cache.del self._cachekey, (err, response) ->
            deferred.reject err if err
            deferred.resolve null
        else
          deferred.resolve null

    return deferred.promise

  cacheKey: (obj) ->
    key = "#{@table}:"
    for k in obj.$primkeys
      for keyname in k.keyName
        key += obj[keyname] + ':'
    return key.slice(0, -1).replace(/\s+/g, '')

  cacheDate: (obj)->
    _cacheData = {}
    for name, field of obj.$nameToField
      # 把数据存到cacheData，用于存入cache
      _cacheData[name] = field.toDB obj[name]
    return _cacheData

module.exports = QueryTable