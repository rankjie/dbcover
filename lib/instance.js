var Instance, Q, QueryTable, Validators, _, toType;

toType = require('./utils').toType;

_ = require('lodash');

Validators = require('./validators').Validators;

QueryTable = require('./querytable');

Q = require('q');

Instance = (function() {
  function Instance(table, pks, nameToField, vals, db, cache, userDefineMethods, primkeys, ttl) {
    var field, i, len, method, name, ref;
    this.$table = table;
    this.$pks = _.cloneDeep(pks);
    this.$nameToField = _.cloneDeep(nameToField);
    this.$db = db;
    this.$cache = cache;
    this.$primkeys = primkeys;
    this.$ttl = ttl;
    ref = this.$nameToField;
    for (name in ref) {
      field = ref[name];
      this[name] = _.cloneDeep(vals[name]);
      field.val = _.cloneDeep(vals[name]);
    }
    for (i = 0, len = userDefineMethods.length; i < len; i++) {
      method = userDefineMethods[i];
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
    var deferred, field, i, index, j, len, len1, name, re, ref, ref1, ref2, result;
    deferred = Q.defer();
    result = {};
    if (this.$pks != null) {
      ref = this.$pks;
      for (i = 0, len = ref.length; i < len; i++) {
        index = ref[i];
        ref1 = index.fields;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          name = ref1[j];
          if (!(this[name] == null)) {
            continue;
          }
          result.error = "Error: Field " + name + ": is missing";
          return result;
        }
      }
    }
    ref2 = this.$nameToField;
    for (name in ref2) {
      field = ref2[name];
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
    var field, name, ref, vals;
    vals = {};
    ref = this.$nameToField;
    for (name in ref) {
      field = ref[name];
      vals[name] = this[name];
    }
    return vals;
  };

  return Instance;

})();

module.exports = Instance;
