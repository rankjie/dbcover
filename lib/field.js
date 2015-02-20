var Field, IntegerField, JSONField, NumberField, StringField, TimestampField, createField, fieldTypes, toType,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

toType = require('./utils').toType;

Field = (function() {
  function Field(attrs) {
    var ref, ref1, ref2, ref3, ref4, ref5;
    this.name = attrs.name;
    this.column = (ref = attrs.column) != null ? ref : this.name;
    this.validator = (ref1 = attrs.validator) != null ? ref1 : null;
    this.required = (ref2 = attrs.required) != null ? ref2 : false;
    this.primkey = (ref3 = attrs.primkey) != null ? ref3 : false;
    this.auto = (ref4 = attrs.auto) != null ? ref4 : false;
    this.uniq = (ref5 = attrs.uniq) != null ? ref5 : false;
  }

  Field.prototype.say = function() {
    return console.log('喵');
  };

  Field.prototype.toDB = function(val) {
    return val;
  };

  Field.prototype.fromDB = function(val) {
    return val;
  };

  return Field;

})();

fieldTypes = {};

fieldTypes['integer'] = IntegerField = (function(superClass) {
  extend(IntegerField, superClass);

  function IntegerField() {
    return IntegerField.__super__.constructor.apply(this, arguments);
  }

  IntegerField.prototype.toDB = function(val) {
    return val;
  };

  IntegerField.prototype.fromDB = function(val) {
    return val;
  };

  IntegerField.prototype.defaultValue = function() {
    return 0;
  };

  return IntegerField;

})(Field);

fieldTypes['number'] = NumberField = (function(superClass) {
  extend(NumberField, superClass);

  function NumberField() {
    return NumberField.__super__.constructor.apply(this, arguments);
  }

  NumberField.prototype.toDB = function(val) {
    return val;
  };

  NumberField.prototype.fromDB = function(val) {
    return val;
  };

  NumberField.prototype.defaultValue = function() {
    return 0;
  };

  return NumberField;

})(Field);

fieldTypes['string'] = StringField = (function(superClass) {
  extend(StringField, superClass);

  function StringField() {
    return StringField.__super__.constructor.apply(this, arguments);
  }

  StringField.prototype.toDB = function(val) {
    return val;
  };

  StringField.prototype.fromDB = function(val) {
    return val;
  };

  StringField.prototype.defaultValue = function() {
    return '';
  };

  return StringField;

})(Field);

fieldTypes['boolean'] = StringField = (function(superClass) {
  extend(StringField, superClass);

  function StringField() {
    return StringField.__super__.constructor.apply(this, arguments);
  }

  StringField.prototype.toDB = function(val) {
    if (val) {
      return 1;
    } else {
      return 0;
    }
  };

  StringField.prototype.fromDB = function(val) {
    if (val === 1) {
      return true;
    } else {
      return false;
    }
  };

  StringField.prototype.defaultValue = function() {
    return null;
  };

  return StringField;

})(Field);

fieldTypes['timestamp'] = TimestampField = (function(superClass) {
  extend(TimestampField, superClass);

  function TimestampField() {
    return TimestampField.__super__.constructor.apply(this, arguments);
  }

  TimestampField.prototype.toDB = function(val) {
    var e;
    if (val == null) {
      return val;
    }
    try {
      return (new Date(val)).toISOString();
    } catch (_error) {
      e = _error;
      return null;
    }
  };

  TimestampField.prototype.fromDB = function(val) {
    var e;
    if (val == null) {
      return val;
    }
    try {
      return new Date(val);
    } catch (_error) {
      e = _error;
      return null;
    }
  };

  return TimestampField;

})(Field);

fieldTypes['json'] = JSONField = (function(superClass) {
  extend(JSONField, superClass);

  function JSONField() {
    return JSONField.__super__.constructor.apply(this, arguments);
  }

  JSONField.prototype.toDB = function(val) {
    if (val == null) {
      return val;
    }
    return JSON.stringify(val);
  };

  JSONField.prototype.fromDB = function(val) {
    var e;
    if (val == null) {
      return val;
    }
    try {
      return JSON.parse(val);
    } catch (_error) {
      e = _error;
      return val;
    }
  };

  JSONField.prototype.defaultValue = function() {
    return {};
  };

  return JSONField;

})(Field);

createField = function(define) {
  var FieldType;
  FieldType = fieldTypes[define.type] || Field;
  return new FieldType(define);
};

exports.createField = createField;
