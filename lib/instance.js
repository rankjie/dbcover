var Instance, Q, QueryTable, Validators, toType, _;

toType = require('./utils').toType;

_ = require('lodash');

Validators = require('./validators').Validators;

QueryTable = require('./querytable');

Q = require('q');

Instance = (function() {
  function Instance(table, pks, nameToField, vals, db, cache, userDefineMethods, primkeys, ttl) {
    var field, method, name, _i, _len, _ref;
    this.$table = table;
    this.$pks = _.cloneDeep(pks);
    this.$nameToField = _.cloneDeep(nameToField);
    this.$db = db;
    this.$cache = cache;
    this.$primkeys = primkeys;
    this.$ttl = ttl;
    _ref = this.$nameToField;
    for (name in _ref) {
      field = _ref[name];
      this[name] = _.cloneDeep(vals[name]);
      field.val = _.cloneDeep(vals[name]);
    }
    for (_i = 0, _len = userDefineMethods.length; _i < _len; _i++) {
      method = userDefineMethods[_i];
      Instance.prototype[method.name] = method.body;
    }
  }

  Instance.prototype.save = function() {
    var queryTable, self, validationResult;
    queryTable = new QueryTable(this.$table, this.$db, this.$cache, null, this.$nameToField, this.$ttl);
    validationResult = this.validate();
    self = this;
    if (validationResult.error == null) {
      return queryTable.save(this).then(function(result) {
        return Q(self);
      }, function(err) {
        return Q.reject(err);
      });
    } else {
      return Q.reject(validationResult.error);
    }
  };

  Instance.prototype.update = function() {
    var queryTable, validationResult;
    queryTable = new QueryTable(this.$table, this.$db, this.$cache, null, this.$nameToFieldm, this.$ttl);
    validationResult = this.validate();
    if (validationResult.error == null) {
      return queryTable.update(this);
    } else {
      console.log('valid>>>>>>>', validationResult.error);
      return Q.reject(validationResult.error);
    }
  };

  Instance.prototype["delete"] = function() {
    var queryTable;
    queryTable = new QueryTable(this.$table, this.$db, this.$cache, null, this.$nameToField, this.$ttl);
    return queryTable["delete"](this);
  };

  Instance.prototype.validate = function() {
    var deferred, field, index, name, re, result, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    deferred = Q.defer();
    result = {};
    if (this.$pks != null) {
      _ref = this.$pks;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        index = _ref[_i];
        _ref1 = index.fields;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          name = _ref1[_j];
          if (!(this[name] == null)) {
            continue;
          }
          result.error = "Error: Field " + name + ": is missing";
          return result;
        }
      }
    }
    _ref2 = this.$nameToField;
    for (name in _ref2) {
      field = _ref2[name];
      if ((field.required || field.primkey) && (this[name] == null) && !field.auto) {
        result.error = "Error: Field " + name + ": is missing";
        return result;
      }
      if (field.validator != null) {
        if (toType(field.validator) === 'string') {
          re = new Validators[field.validator].doValidate(this[name]);
        } else {
          re = field.validator.doValidate(this[name]);
        }
        if (re.error) {
          result.error = "Error: Field " + name + ": " + re.error;
        }
      }
    }
    return result;
  };

  Instance.prototype.getVals = function() {
    var field, name, vals, _ref;
    vals = {};
    _ref = this.$nameToField;
    for (name in _ref) {
      field = _ref[name];
      vals[name] = this[name];
    }
    return vals;
  };

  return Instance;

})();

module.exports = Instance;
