var Q, QueryTable, _, old_console_log, prefix, replace_char, sqlbuilder, toType;

sqlbuilder = require('squel');

_ = require('lodash');

Q = require('q');

toType = require('./utils').toType;

replace_char = '?';

prefix = ':';

old_console_log = console.log;

QueryTable = (function() {
  function QueryTable(table, db, cache, model, nameToField, ttl, _debug) {
    this.table = table;
    this.db = db;
    this.cache = cache;
    this.nameToField = nameToField;
    this.ttl = ttl;
    this._debug = _debug;
    this.model = model != null ? model : null;
  }

  QueryTable.prototype.debug = function() {
    if (this._debug) {
      return old_console_log.apply(this, arguments);
    }
  };

  QueryTable.prototype.find = function(inputRawSQL, condition) {
    this._inputRawSQL = inputRawSQL;
    this._condition = condition;
    this._queryType = 'find';
    return this;
  };

  QueryTable.prototype.count = function(wheres) {
    var defer, sql;
    sql = ("SELECT COUNT('" + this.nameToField[Object.keys(this.nameToField)[0]]['column'] + "') AS count FROM " + this.table) + (wheres != null ? ' where ' + wheres : '');
    defer = Q.defer();
    this.db.debug = this._debug;
    this.db.query(sql, function(err, data) {
      if (err != null) {
        return defer.reject(err);
      }
      return defer.resolve(data[0]['count']);
    });
    return defer.promise;
  };

  QueryTable.prototype.set = function(args) {
    this._args = args;
    return this;
  };

  QueryTable.prototype.orderBy = function(args, order) {
    var _order;
    this._orderBy = [];
    this._order = [];
    this._orderBy.push(args);
    _order = order.toUpperCase() === 'DESC' ? false : true;
    this._order.push(_order);
    return this;
  };

  QueryTable.prototype.all = function() {
    return this.list(0, 0);
  };

  QueryTable.prototype.first = function() {
    this._first = true;
    return this.list(0, 1);
  };

  QueryTable.prototype.list = function(offset, limit) {
    this._offset = offset || 0;
    this._limit = limit;
    return this.query();
  };

  QueryTable.prototype.save = function(obj) {
    var field, name, ref;
    this._queryType = 'insert';
    this._cacheData = {};
    this._fieldsToInsert = [];
    this._auto = [];
    this._objToSave = obj;
    ref = obj.$nameToField;
    for (name in ref) {
      field = ref[name];
      if (field.auto) {
        this._auto.push(name);
      } else {
        this._cacheData[name] = field.toDB(obj[name]);
        field.val = _.cloneDeep(obj[name]);
        this._fieldsToInsert.push({
          column: field.column,
          value: field.toDB(obj[name])
        });
      }
    }
    this._cachekey = this.cacheKey(obj);
    return this.query();
  };

  QueryTable.prototype.update = function(obj) {
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
    for (name in ref2) {
      field = ref2[name];
      if (!(!_.isEqual(obj[name], field.val))) {
        continue;
      }
      field.val = obj[name];
      this._fieldsToUpdate.push({
        column: field.column,
        value: field.toDB(obj[name])
      });
    }
    if (this._fieldsToUpdate.length === 0) {
      return Q();
    }
    this._cachekey = this.cacheKey(obj);
    this._objToUpdate = obj;
    return this.query();
  };

  QueryTable.prototype["delete"] = function(obj) {
    var j, k, l, len, len1, name, ref, ref1;
    this._queryType = 'delete';
    this.pkStr = [];
    ref = obj.$primkeys;
    for (j = 0, len = ref.length; j < len; j++) {
      k = ref[j];
      ref1 = k.keyName;
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        name = ref1[l];
        this.pkStr.push(obj.$nameToField[name].column + " = '" + obj.$nameToField[name].val + "'");
      }
    }
    return this.query();
  };

  QueryTable.prototype.toSQL = function() {
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
      if ((this._limit != null) && this._limit !== 0) {
        sql = sql.limit(this._limit);
      }
      if (this._offset != null) {
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
      sql = sqlbuilder["delete"]().from(this.table);
      ref7 = this.pkStr;
      for (o = 0, len4 = ref7.length; o < len4; o++) {
        str = ref7[o];
        sql = sql.where(str);
      }
    }
    return sql.toString();
  };

  QueryTable.prototype.query = function() {
    var cacheKey, cacheToInstance, dbToInstance, deferred, instanceToCache, ref, self, sql;
    self = this;
    deferred = Q.defer();
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
        instances.push(self.model["new"](row));
      }
      return instances;
    };
    instanceToCache = function(obj) {
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
        instances.push(self.model["new"](row));
      }
      return instances;
    };
    if (self._queryType === 'find') {
      cacheKey = sql.replace(/\s+/g, '');
      if (self.cache) {
        self.cache.get(cacheKey, function(err, data) {
          var d, ref;
          if (err) {
            deferred.reject(err);
          }
          if (_.isEmpty(data) || (data.$family != null)) {
            return self.db.query(sql, (ref = self._condition) != null ? ref : self._args, function(err, rows) {
              var datas;
              if (err != null) {
                return deferred.reject(err);
              } else {
                if (rows.length > 0) {
                  datas = dbToInstance(rows);
                  return self.cache.set(cacheKey, JSON.stringify(rows), self.ttl, function(err, response) {
                    var j, len, obj;
                    for (j = 0, len = datas.length; j < len; j++) {
                      obj = datas[j];
                      self.cache.set(self.cacheKey(obj), JSON.stringify(self.cacheDate(obj)), self.ttl);
                    }
                    return deferred.resolve(self._first ? datas[0] : datas);
                  });
                } else {
                  return deferred.resolve(null);
                }
              }
            });
          } else {
            d = cacheToInstance(data[cacheKey]);
            if (self._first) {
              d = d[0];
            }
            return deferred.resolve(d);
          }
        });
      } else {
        self.db.query(sql, (ref = self._condition) != null ? ref : self._args, function(err, rows) {
          if (err != null) {
            return deferred.reject(err);
          } else {
            return deferred.resolve(self._first ? dbToInstance(rows)[0] : dbToInstance(rows));
          }
        });
      }
    }
    if (self._queryType === 'insert') {
      self.db.query(sql, function(err, rows) {
        var j, len, name, ref1;
        if (err) {
          deferred.reject(err);
          return deferred.promise;
        }
        ref1 = self._auto;
        for (j = 0, len = ref1.length; j < len; j++) {
          name = ref1[j];
          self._objToSave[name] = rows.insertId;
          self._objToSave.$nameToField[name].val = rows.insertId;
          self._cacheData[name] = self._objToSave.$nameToField[name].toDB(self._objToSave[name]);
        }
        if (self.cache) {
          return self.cache.set(self.cacheKey(self._objToSave), JSON.stringify(self._cacheData), self.ttl, function(err, response) {
            if (err != null) {
              deferred.reject(rows);
            }
            return deferred.resolve(rows);
          });
        } else {
          return deferred.resolve(rows);
        }
      });
    }
    if (self._queryType === 'delete') {
      self.db.query(sql, function(err, rows) {
        if (err) {
          deferred.reject(err);
        }
        if (self.cache) {
          return self.cache.del(self._cachekey, function(err, numberOfRowsDeleted) {
            if (err) {
              deferred.reject(err);
            }
            return deferred.resolve(true);
          });
        } else {
          return deferred.resolve(true);
        }
      });
    }
    if (self._queryType === 'update') {
      self.db.query(sql, function(err, rows) {
        if (err) {
          deferred.reject(err);
        }
        if (self.cache) {
          return self.cache.del(self._cachekey, function(err, response) {
            if (err) {
              deferred.reject(err);
            }
            return deferred.resolve(self._objToUpdate);
          });
        } else {
          return deferred.resolve(self._objToUpdate);
        }
      });
    }
    return deferred.promise;
  };

  QueryTable.prototype.cacheKey = function(obj) {
    var j, k, key, keyname, l, len, len1, ref, ref1;
    key = this.table + ":";
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
  };

  QueryTable.prototype.cacheDate = function(obj) {
    var _cacheData, field, name, ref;
    _cacheData = {};
    ref = obj.$nameToField;
    for (name in ref) {
      field = ref[name];
      _cacheData[name] = field.toDB(obj[name]);
    }
    return _cacheData;
  };

  return QueryTable;

})();

module.exports = QueryTable;
