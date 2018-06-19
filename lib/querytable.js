var Q, QueryTable, _, old_console_log, prefix, replace_char, sqlbuilder, toType;

sqlbuilder = require('squel');

_ = require('lodash');

Q = require('q');

({toType} = require('./utils'));

replace_char = '?';

prefix = ':';

old_console_log = console.log;

QueryTable = class QueryTable {
  constructor(table, db, cache, model, nameToField, ttl, _debug) {
    this.table = table;
    this.db = db;
    this.cache = cache;
    this.nameToField = nameToField;
    this.ttl = ttl;
    this._debug = _debug;
    this.model = model != null ? model : null;
  }

  debug() {
    if (this._debug) {
      return old_console_log.apply(this, arguments);
    }
  }

  // 只有model才有的方法
  find(inputRawSQL, condition) {
    // SELECT id,name,mail..... FROM users
    this._inputRawSQL = inputRawSQL;
    this._condition = condition;
    this._queryType = 'find';
    return this;
  }

  count(wheres) {
    var sql;
    sql = `SELECT COUNT('${this.nameToField[Object.keys(this.nameToField)[0]]['column']}') AS count FROM ${this.table}` + (wheres != null ? ' where ' + wheres : '');
    this.db.debug = this._debug;
    return this.db.query(sql).then(function(data) {
      return Q(data[0].count);
    });
  }

  set(args) {
    this._args = args;
    return this;
  }

  orderBy(args, order) {
    var _order;
    this._orderBy = [];
    this._order = [];
    this._orderBy.push(args);
    _order = order.toUpperCase() !== 'DESC';
    this._order.push(_order);
    return this;
  }

  all() {
    return this.list(0, 0);
  }

  first() {
    this._first = true;
    return this.list(0, 1);
  }

  list(offset, limit) {
    this.offset = offset;
    this.limit = limit;
    return this.query();
  }

  save(obj) {
    var field, name, ref;
    this._queryType = 'insert';
    this._cacheData = {};
    this._fieldsToInsert = [];
    this._auto = [];
    this._objToSave = obj;
    ref = obj.$nameToField;
    for (name in ref) {
      field = ref[name];
      // 如果有field需要等save之后才能获得（id），那就先不载入这个数组，并且记录下来，这样等下存完了就可以抓到完整放进cache
      if (field.auto) {
        this._auto.push(name);
      } else {
        // 把数据存到cacheData，用于存入cache
        this._cacheData[name] = field.toDB(obj[name]);
        // 因为save之前可能数据已经更改过，所以更新一下field.val
        field.val = _.cloneDeep(obj[name]);
        // 数据存入fieldsToInsert，用于存入db
        this._fieldsToInsert.push({
          column: field.column,
          value: field.toDB(obj[name])
        });
      }
    }
    this._cachekey = this.cacheKey(obj);
    return this.query();
  }

  update(obj) {
    var field, j, k, l, len, len1, name, ref, ref1, ref2;
    this._queryType = 'update';
    this._fieldsToUpdate = [];
    this.pkStr = [];
    ref = obj.$primkeys;
    for (j = 0, len = ref.length; j < len; j++) {
      k = ref[j];
      ref1 = k.keyName;
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        name = ref1[l];
        if ((obj.$nameToField[name].val != null) && obj.$nameToField[name].val !== '') {
          this.pkStr.push(obj.$nameToField[name].column + " = '" + obj.$nameToField[name].val + "'");
        }
      }
    }
    ref2 = obj.$nameToField;
    // 找出需要做update的数据
    for (name in ref2) {
      field = ref2[name];
      if (!(!_.isEqual(obj[name], field.val))) {
        continue;
      }
      // 更新field.val为最新的值
      field.val = obj[name];
      this._fieldsToUpdate.push({
        column: field.column,
        value: field.toDB(obj[name])
      });
    }
    if (this._fieldsToUpdate.length === 0) {
      return Q();
    }
    // 取出一会儿要从cache里删除的key
    this._cachekey = this.cacheKey(obj);
    this._objToUpdate = obj;
    return this.query();
  }

  delete(obj) {
    var j, k, l, len, len1, name, ref, ref1;
    this._queryType = 'delete';
    this.pkStr = [];
    ref = obj.$primkeys;
    for (j = 0, len = ref.length; j < len; j++) {
      k = ref[j];
      ref1 = k.keyName;
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        name = ref1[l];
        // 因为instance可能在delete之前有修改过变量值，但是没有update。这时候数据库的数据是老的，所以要用
        // nameToField里面存的变量（用于在update的时候找出需要做set的column）
        this.pkStr.push(obj.$nameToField[name].column + " = '" + obj.$nameToField[name].val + "'");
      }
    }
    return this.query();
  }

  toSQL() {
    var columnName, f, field, i, j, k, l, len, len1, len2, len3, len4, m, n, name, o, operator, operators, opkey, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, sql, str, v;
    if (this._queryType === 'find') {
      sql = sqlbuilder.select().from(this.table);
      ref = this.nameToField;
      for (name in ref) {
        field = ref[name];
        sql = sql.field(field.column, name);
      }
      if (this._inputRawSQL == null) {
        sql = sql;
      } else if (toType(this._inputRawSQL) === 'string') {
        sql = sql.where(this._inputRawSQL);
      } else if (toType(this._inputRawSQL) === 'object') {
        ref1 = this._inputRawSQL;
        for (k in ref1) {
          v = ref1[k];
          // 传入的参数
          // userId: 123  或者  userId__gt: 123
          // userId并不是column name，所以要转换一下
          operators = {
            '__gt': ' > ',
            '__lt': ' < '
          };
          opkey = k.slice(k.length - 4, k.length);
          if (opkey !== '__gt' && opkey !== '__lt') {
            operator = ' = ';
            columnName = k;
          } else {
            operator = operators[opkey];
            columnName = k.slice(0, k.length - 4);
          }
          sql = sql.where(this.nameToField[columnName].column + operator + "'" + this.nameToField[columnName].toDB(v) + "'");
        }
      }
      if ((this._orderBy != null) && this._orderBy.length > 0) {
        ref2 = this._orderBy;
        for (i = j = 0, len = ref2.length; j < len; i = ++j) {
          f = ref2[i];
          sql = sql.order(f, this._order[i]);
        }
      }
      if (this._limit) {
        sql = sql.limit(this._limit);
      }
      if (this._offset) {
        sql = sql.offset(this._offset);
      }
    } else if (this._queryType === 'update') {
      sql = sqlbuilder.update().table(this.table);
      ref3 = this._fieldsToUpdate;
      for (l = 0, len1 = ref3.length; l < len1; l++) {
        f = ref3[l];
        if ((f.value != null) && toType(f.value) === 'string') {
          f.value = f.value.replace(/'/g, "\\'");
        }
        sql = sql.set(f.column, f.value);
      }
      ref4 = this.pkStr;
      for (m = 0, len2 = ref4.length; m < len2; m++) {
        str = ref4[m];
        sql = sql.where(str);
      }
    } else if (this._queryType === 'insert') {
      sql = sqlbuilder.insert().into(this.table);
      ref5 = this._fieldsToInsert;
      for (n = 0, len3 = ref5.length; n < len3; n++) {
        f = ref5[n];
        if ((f.value != null) && toType(f.value) === 'string') {
          f.value = f.value.replace(/'/g, "\\'");
        }
        sql = sql.set(f.column, (ref6 = f.value) != null ? ref6 : null);
      }
    } else if (this._queryType === 'delete') {
      sql = sqlbuilder.delete().from(this.table);
      ref7 = this.pkStr;
      for (o = 0, len4 = ref7.length; o < len4; o++) {
        str = ref7[o];
        sql = sql.where(str);
      }
    }
    // if @_condition?
    //   s = sql.toString()
    //   for i in [0...s.match(/\?/g).length] by 1
    //     @debug @_condition[i]
    //     s = s.substr(0, s.indexOf replace_char) + "#{@_condition[i]}" + s.substr(s.indexOf(replace_char) + replace_char.length)
    // else if @_args?
    //   for k, v of @_args
    //     s = s.replace prefix+k, "#{v}"

    // @debug '最后执行的sql：'+sql.toString()
    return sql.toString();
  }

  // 因为err了就不用后面的操作了，直接return吧
  async query() {
    var e, self;
    self = this;
    try {
      return (await self.queryWrapped());
    } catch (error) {
      e = error;
      return Q.reject(e);
    }
  }

  async queryWrapped() {
    var cacheKey, cacheToInstance, d, data, datas, dbToInstance, instanceToCache, j, l, len, len1, name, obj, ref, ref1, rows, self, sql;
    self = this;
    sql = self.toSQL();
    self.db.debug = this._debug;
    cacheToInstance = function(rows) {
      var field, instances, j, len, name, ref, ref1, row;
      self.debug('[dbcover] Found data in cache.');
      instances = [];
      ref = JSON.parse(rows);
      for (j = 0, len = ref.length; j < len; j++) {
        row = ref[j];
        ref1 = self.nameToField;
        for (name in ref1) {
          field = ref1[name];
          row[name] = field.fromDB(row[name]);
        }
        instances.push(self.model.new(row));
      }
      return instances;
    };
    instanceToCache = function(obj) {
      // @debug obj.$cacheData
      return JSON.stringify(obj.$cacheData);
    };
    dbToInstance = function(rows) {
      var field, instances, j, len, name, ref, row;
      self.debug('[dbcover] Load data from DB.');
      instances = [];
      for (j = 0, len = rows.length; j < len; j++) {
        row = rows[j];
        ref = self.nameToField;
        for (name in ref) {
          field = ref[name];
          row[name] = field.fromDB(row[name]);
        }
        instances.push(self.model.new(row));
      }
      return instances;
    };
    // select类型，返回
    if (self._queryType === 'find') {
      cacheKey = sql.replace(/\s+/g, '');
      // 看是否有cache定义

      // @debug '有定义cache哦！'
      // @debug self
      // 先从cache找
      if (self.cache) {
        data = (await self.cache.get(cacheKey));
        // cache没有
        // memcached这里有个bug(?)，如果查不到对应的key，会返回一个很奇怪的对象（包含一个叫$family等的东西，所以这样粗糙hack一下）
        // need further fix
        if (!(_.isEmpty(data) || (data.$family != null))) {
          d = cacheToInstance(data[cacheKey]);
          if (self._first) {
            return Q(d[0]);
          }
          return Q(d);
        }
      }
      // @debug 'cache查到的是空的'
      // 从db查
      rows = (await self.db.query(sql, (ref = self._condition) != null ? ref : self._args));
      if (rows.length <= 0) {
        return Q(null);
      }
      datas = dbToInstance(rows);
      // 先把sql作为key，存入cache
      if (self.cache) {
        self.cache.set(cacheKey, JSON.stringify(rows), self.ttl);
        for (j = 0, len = datas.length; j < len; j++) {
          obj = datas[j];
          self.cache.set(self.cacheKey(obj), JSON.stringify(self.cacheDate(obj)), self.ttl);
        }
      }
      if (self._first) {
        return Q(datas[0]);
      }
      return Q(datas);
    }
    // insert类型
    if (self._queryType === 'insert') {
      // 存入db
      rows = (await self.db.query(sql));
      ref1 = self._auto;
      // 取出auto的ID
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        name = ref1[l];
        self._objToSave[name] = rows.insertId;
        self._objToSave.$nameToField[name].val = rows.insertId;
        self._cacheData[name] = self._objToSave.$nameToField[name].toDB(self._objToSave[name]);
      }
      if (self.cache) {
        // 存入cache
        self.cache.set(self.cacheKey(self._objToSave), JSON.stringify(self._cacheData), self.ttl);
      }
      Q(rows);
    }
    
    // update类型，更新完db后从cache里删除该对象数据
    if (self._queryType === 'delete') {
      await self.db.query(sql);
      if (self.cache) {
        self.cache.del(self._cachekey);
      }
      Q(true);
    }
    if (self._queryType === 'update') {
      await self.db.query(sql);
      if (self.cache) {
        self.cache.del(self._cachekey);
      }
      return Q(self._objToUpdate);
    }
  }

  cacheKey(obj) {
    var j, k, key, keyname, l, len, len1, ref, ref1;
    key = `${this.table}:`;
    ref = obj.$primkeys;
    for (j = 0, len = ref.length; j < len; j++) {
      k = ref[j];
      ref1 = k.keyName;
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        keyname = ref1[l];
        key += obj[keyname] + ':';
      }
    }
    return key.slice(0, -1).replace(/\s+/g, '');
  }

  cacheDate(obj) {
    var _cacheData, field, name, ref;
    _cacheData = {};
    ref = obj.$nameToField;
    for (name in ref) {
      field = ref[name];
      // 把数据存到cacheData，用于存入cache
      _cacheData[name] = field.toDB(obj[name]);
    }
    return _cacheData;
  }

};

module.exports = QueryTable;
