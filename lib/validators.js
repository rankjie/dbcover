var EmailValidator, IntegerValidator, NullValidator, StringValidator, Validators, err_msg, isEmail, isInt, isString, toType;

toType = require('./utils').toType;

Validators = {};

err_msg = 'value check failed';

isInt = function(n) {
  return toType(n) === 'number' && n % 1 === 0;
};

isString = function(str) {
  return toType(str) === 'string';
};

isEmail = function(email) {
  var re;
  re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

Validators.integer = IntegerValidator = (function() {
  function IntegerValidator(min, max) {
    this.result = {};
    this.min = min;
    this.max = max;
  }

  IntegerValidator.prototype.doValidate = function(num) {
    if (!isInt(num) || num > this.max || num < this.min) {
      this.result.error = err_msg;
    }
    return this.result;
  };

  return IntegerValidator;

})();

Validators.string = StringValidator = (function() {
  function StringValidator(minx, max) {
    this.result = {};
    this.min = min;
    this.max = max;
  }

  StringValidator.prototype.doValidate = function(str) {
    if (!isString(str) || str.length < this.min || str.length > this.max) {
      this.result.error = err_msg;
    }
    return this.result;
  };

  return StringValidator;

})();

Validators.email = EmailValidator = (function() {
  function EmailValidator() {
    this.result = {};
  }

  EmailValidator.prototype.doValidate = function(str) {
    if (!isEmail(str)) {
      this.result.error = err_msg;
    }
    return this.result;
  };

  return EmailValidator;

})();

Validators.required = NullValidator = (function() {
  function NullValidator() {
    this.result = {};
  }

  NullValidator.prototype.doValidate = function(str) {
    if (str == null) {
      this.result.error = err_msg;
    }
    return this.result;
  };

  return NullValidator;

})();

exports.Validators = Validators;

exports.IntegerValidator = IntegerValidator;

exports.StringValidator = StringValidator;

exports.EmailValidator = EmailValidator;
