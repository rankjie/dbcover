var BoolenField, Field, IntegerField, JSONField, NumberField, StringField, TimestampField, createField, fieldTypes, toType;

({toType} = require('./utils'));

Field = class Field {
  constructor(attrs) {
    var ref, ref1, ref2, ref3, ref4, ref5;
    this.name = attrs.name;
    this.column = (ref = attrs.column) != null ? ref : this.name;
    this.validator = (ref1 = attrs.validator) != null ? ref1 : null;
    this.required = (ref2 = attrs.required) != null ? ref2 : false;
    this.primkey = (ref3 = attrs.primkey) != null ? ref3 : false;
    this.auto = (ref4 = attrs.auto) != null ? ref4 : false;
    this.uniq = (ref5 = attrs.uniq) != null ? ref5 : false;
  }

  say() {
    return console.log('喵');
  }

  toDB(val) {
    return val;
  }

  fromDB(val) {
    return val;
  }

};

fieldTypes = {};

fieldTypes['integer'] = IntegerField = class IntegerField extends Field {
  toDB(val) {
    return val;
  }

  fromDB(val) {
    return val;
  }

  defaultValue() {
    return 0;
  }

};

fieldTypes['number'] = NumberField = class NumberField extends Field {
  toDB(val) {
    return val;
  }

  fromDB(val) {
    return val;
  }

  defaultValue() {
    return 0;
  }

};

fieldTypes['string'] = StringField = class StringField extends Field {
  toDB(val) {
    return val;
  }

  fromDB(val) {
    return val;
  }

  defaultValue() {
    return '';
  }

};

fieldTypes['boolean'] = BoolenField = class BoolenField extends Field {
  toDB(val) {
    if (val) {
      return 1;
    } else {
      return 0;
    }
  }

  fromDB(val) {
    return Number(val) === 1;
  }

  defaultValue() {
    return null;
  }

};

fieldTypes['timestamp'] = TimestampField = class TimestampField extends Field {
  toDB(val) {
    var e;
    if (val == null) {
      return val;
    }
    try {
      return (new Date(val)).toISOString();
    } catch (error) {
      e = error;
      return null;
    }
  }

  fromDB(val) {
    var e;
    if (val == null) {
      return val;
    }
    try {
      return new Date(val);
    } catch (error) {
      e = error;
      return null;
    }
  }

};

fieldTypes['json'] = JSONField = class JSONField extends Field {
  toDB(val) {
    if (val == null) {
      return val;
    }
    return JSON.stringify(val);
  }

  fromDB(val) {
    var e;
    if (val == null) {
      return val;
    }
    try {
      return JSON.parse(val);
    } catch (error) {
      e = error;
      return val;
    }
  }

  defaultValue() {
    return {};
  }

};

createField = function(define) {
  var FieldType;
  FieldType = fieldTypes[define.type] || Field;
  return new FieldType(define);
};

exports.createField = createField;
