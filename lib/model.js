var EmailValidator, Instance, IntegerValidator, Model, Observe, Q, QueryTable, StringValidator, Validators, _, cache, cacheGroup, createField, db, defaultTTL, repoGroup, toType;

_ = require('lodash');

({toType} = require('./utils'));

({createField} = require('./field'));

db = require('./db/db');

cache = require('./cache/cache');

Instance = require('./instance');

QueryTable = require('./querytable');

({Validators, StringValidator, IntegerValidator, EmailValidator} = require('./validators'));

Q = require('q');

repoGroup = {};

cacheGroup = {};

defaultTTL = 60;

Observe = class Observe {
  define(cata, config) {
    if (cata === 'repo') {
      repoGroup[config.name] = db(config.provider);
    }
    if (cata === 'cache') {
      return cacheGroup[config.name] = cache(config.provider);
    }
  }

  getRepoAll() {
    return repoGroup;
  }

  getCacheAll() {
    return cacheGroup;
  }

  endRepoAll() {
    var k, results, v;
    results = [];
    for (k in repoGroup) {
      v = repoGroup[k];
      results.push(v.end());
    }
    return results;
  }

  endCacheAll() {
    var k, results, v;
    results = [];
    for (k in cacheGroup) {
      v = cacheGroup[k];
      results.push(v.end());
    }
    return results;
  }

  endAll() {
    this.endCacheAll();
    return this.endRepoAll();
  }

};

Model = class Model {
  // 生产Model
  // User = new Model
  constructor(dataDefine) {
    var body, camelCased, f, j, k, key, keyName, l, len, len1, len2, len3, m, n, name, ref, ref1, ref2, ref3, ref4, ref5, ref6, v;
    this.$indices = dataDefine.meta.indices;
    this.$table = dataDefine.meta.table;
    this.$repo = repoGroup[dataDefine.meta.repo] || repoGroup['default'];
    this.$ttl = (ref = dataDefine.meta.ttl) != null ? ref : defaultTTL;
    this.$cache = false;
    if (dataDefine.meta.cache) {
      this.$cache = cacheGroup[dataDefine.meta.cache] || cacheGroup['default'];
    }
    this.debug = false;
    this.$nameToField = {};
    ref1 = dataDefine.meta.fields;
    for (j = 0, len = ref1.length; j < len; j++) {
      f = ref1[j];
      this.$nameToField[f.name] = createField(_.cloneDeep(f));
      ref2 = Object.getPrototypeOf(this.$nameToField[f.name]);
      // 要把validator的prototype拷贝过去，因为cloneDeep不拷贝prototype
      // 这里是拷贝每个field所具备的toDB和fromDB等方法
      for (k in ref2) {
        v = ref2[k];
        this.$nameToField[f.name][k] = v;
      }
      // 这里是拷贝validator的doValidate
      if (f.validator) {
        ref3 = Object.getPrototypeOf(f.validator);
        for (name in ref3) {
          body = ref3[name];
          this.$nameToField[f.name].validator[name] = body;
        }
      }
    }
    // 用户自定义方法
    this.$userDefineMethods = [];
    for (k in dataDefine) {
      v = dataDefine[k];
      if (toType(v) === 'function') {
        Model.prototype[k] = v;
        this.$userDefineMethods.push({
          name: k,
          body: v
        });
      }
    }
    // 集合需要实现findBy的primkey
    this.primkeys = [];
    ref4 = dataDefine.meta.fields;
    for (l = 0, len1 = ref4.length; l < len1; l++) {
      f = ref4[l];
      if (!(f.primkey != null)) {
        continue;
      }
      key = f.name;
      keyName = [];
      keyName.push(f.name);
      this.primkeys.push({
        name: f.name,
        keyName: keyName
      });
    }
    if (dataDefine.meta.indices != null) {
      ref5 = dataDefine.meta.indices;
      for (m = 0, len2 = ref5.length; m < len2; m++) {
        f = ref5[m];
        if (toType(f.fields) === 'array') {
          keyName = f.fields;
        } else {
          keyName = [];
          keyName.push(index.fields);
        }
        this.primkeys.push({
          name: f.name,
          keyName: keyName
        });
      }
    }
    
    // 实现findByIndex
    // 自动将user_id/blog-id之类的转化为驼峰形式
    camelCased = function(str) {
      return str.charAt(0).toUpperCase() + str.slice(1).replace(/(-|_)([a-z])/g, function(s) {
        return s[1].toUpperCase();
      });
    };
    ref6 = this.primkeys;
    for (n = 0, len3 = ref6.length; n < len3; n++) {
      key = ref6[n];
      (function(key, self) {
        self['findBy' + camelCased(key.name)] = function(v) {
          var len4, o, ref7, sqlStr, values;
          values = {};
          if (toType(v) !== 'object') {
            values[key.name] = v;
          } else {
            values = v;
          }
          sqlStr = [];
          ref7 = key.keyName;
          for (o = 0, len4 = ref7.length; o < len4; o++) {
            name = ref7[o];
            sqlStr.push(self.$nameToField[name].column + " = '" + self.$nameToField[name].toDB(values[name] + "'"));
          }
          if (self.$nameToField[name].uniq) {
            return self.find(sqlStr.join(' AND ')).first();
          }
          return self.find(sqlStr.join(' AND ')).all();
        };
        return self['findBy' + camelCased(key.name) + 's'] = function(v) {
          var i, len4, o, promises;
          promises = [];
          for (o = 0, len4 = v.length; o < len4; o++) {
            i = v[o];
            promises.push(self['findBy' + camelCased(key.name)](i));
          }
          return Q.all(promises).spread(function() {
            var len5, p, re, result;
            re = [];
            for (p = 0, len5 = arguments.length; p < len5; p++) {
              result = arguments[p];
              if (toType(result) === 'array') {
                re = re.concat(result);
              }
              if (toType(result) === 'object') {
                re.push(result);
              }
            }
            return Q(re);
          });
        };
      })(key, this);
    }
  }

  // 生产instance
  // User.new
  turnOnDebug(debug) {
    this.debug = debug;
    return this.$repo.debug = this.debug;
  }

  new(vals) {
    return new Instance(this.$table, this.$indices, this.$nameToField, vals, this.$repo, this.$cache, this.$userDefineMethods, this.primkeys, this.$ttl);
  }

  find(rawSQL, condition, options) {
    var queryTable;
    // 同new
    queryTable = new QueryTable(this.$table, this.$repo, this.$cache, this, this.$nameToField, this.$ttl, this.debug);
    queryTable.withCache = options != null ? options.withCache : void 0;
    // 传入的参数有三种情况：
    // 'age > ? and created > ?', [30, 234242]
    // 'age > :age and created > :created'
    // age: 30, created__gt: 2334343
    // 这些具体问题交给QueryTable处理
    return queryTable.find(rawSQL, condition);
  }

  count(where_str) {
    var queryTable;
    queryTable = new QueryTable(this.$table, this.$repo, this.$cache, this, this.$nameToField, this.$ttl, this.debug);
    return queryTable.count(where_str);
  }

};

exports.Model = Model;

exports.Observe = new Observe;

exports.Validators = Validators;
