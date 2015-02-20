var EmailValidator, Instance, IntegerValidator, Model, Observe, Q, QueryTable, StringValidator, Validators, _, cache, cacheGroup, createField, db, defaultTTL, ref, repoGroup, toType;

_ = require('lodash');

toType = require('./utils').toType;

createField = require('./field').createField;

db = require('./db/db');

cache = require('./cache/cache');

Instance = require('./instance');

QueryTable = require('./querytable');

ref = require('./validators'), Validators = ref.Validators, StringValidator = ref.StringValidator, IntegerValidator = ref.IntegerValidator, EmailValidator = ref.EmailValidator;

Q = require('q');

repoGroup = {};

cacheGroup = {};

defaultTTL = 60;

Observe = (function() {
  function Observe() {}

  Observe.prototype.define = function(cata, config) {
    if (cata === 'repo') {
      repoGroup[config.name] = db(config.provider);
    }
    if (cata === 'cache') {
      return cacheGroup[config.name] = cache(config.provider);
    }
  };

  Observe.prototype.getRepoAll = function() {
    return repoGroup;
  };

  Observe.prototype.getCacheAll = function() {
    return cacheGroup;
  };

  Observe.prototype.endRepoAll = function() {
    var k, results, v;
    results = [];
    for (k in repoGroup) {
      v = repoGroup[k];
      results.push(v.end());
    }
    return results;
  };

  Observe.prototype.endCacheAll = function() {
    var k, results, v;
    results = [];
    for (k in cacheGroup) {
      v = cacheGroup[k];
      results.push(v.end());
    }
    return results;
  };

  Observe.prototype.endAll = function() {
    this.endCacheAll();
    return this.endRepoAll();
  };

  return Observe;

})();

Model = (function() {
  function Model(dataDefine) {
    var body, camelCased, f, fn, j, k, key, keyName, l, len, len1, len2, len3, m, n, name, ref1, ref2, ref3, ref4, ref5, ref6, ref7, v;
    this.$indices = dataDefine.meta.indices;
    this.$table = dataDefine.meta.table;
    this.$repo = repoGroup[dataDefine.meta.repo] || repoGroup['default'];
    this.$ttl = (ref1 = dataDefine.meta.ttl) != null ? ref1 : defaultTTL;
    this.$cache = false;
    if (dataDefine.meta.cache) {
      this.$cache = cacheGroup[dataDefine.meta.cache] || cacheGroup['default'];
    }
    this.debug = false;
    this.$nameToField = {};
    ref2 = dataDefine.meta.fields;
    for (j = 0, len = ref2.length; j < len; j++) {
      f = ref2[j];
      this.$nameToField[f.name] = createField(_.cloneDeep(f));
      ref3 = Object.getPrototypeOf(this.$nameToField[f.name]);
      for (k in ref3) {
        v = ref3[k];
        this.$nameToField[f.name][k] = v;
      }
      if (f.validator) {
        ref4 = Object.getPrototypeOf(f.validator);
        for (name in ref4) {
          body = ref4[name];
          this.$nameToField[f.name].validator[name] = body;
        }
      }
    }
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
    this.primkeys = [];
    ref5 = dataDefine.meta.fields;
    for (l = 0, len1 = ref5.length; l < len1; l++) {
      f = ref5[l];
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
      ref6 = dataDefine.meta.indices;
      for (m = 0, len2 = ref6.length; m < len2; m++) {
        f = ref6[m];
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
    camelCased = function(str) {
      return str.charAt(0).toUpperCase() + str.slice(1).replace(/(-|_)([a-z])/g, function(s) {
        return s[1].toUpperCase();
      });
    };
    ref7 = this.primkeys;
    fn = function(key, self) {
      self['findBy' + camelCased(key.name)] = function(v) {
        var len4, o, ref8, sqlStr, values;
        values = {};
        if (toType(v) !== 'object') {
          values[key.name] = v;
        } else {
          values = v;
        }
        sqlStr = [];
        ref8 = key.keyName;
        for (o = 0, len4 = ref8.length; o < len4; o++) {
          name = ref8[o];
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
    };
    for (n = 0, len3 = ref7.length; n < len3; n++) {
      key = ref7[n];
      fn(key, this);
    }
  }

  Model.prototype.turnOnDebug = function(debug) {
    this.debug = debug;
    return this.$repo.debug = this.debug;
  };

  Model.prototype["new"] = function(vals) {
    return new Instance(this.$table, this.$indices, this.$nameToField, vals, this.$repo, this.$cache, this.$userDefineMethods, this.primkeys, this.$ttl);
  };

  Model.prototype.find = function(rawSQL, condition, options) {
    var queryTable;
    queryTable = new QueryTable(this.$table, this.$repo, this.$cache, this, this.$nameToField, this.$ttl, this.debug);
    queryTable.withCache = options != null ? options.withCache : void 0;
    return queryTable.find(rawSQL, condition);
  };

  Model.prototype.count = function(where_str) {
    var queryTable;
    queryTable = new QueryTable(this.$table, this.$repo, this.$cache, this, this.$nameToField, this.$ttl, this.debug);
    return queryTable.count(where_str);
  };

  return Model;

})();

exports.Model = Model;

exports.Observe = new Observe;

exports.Validators = Validators;
