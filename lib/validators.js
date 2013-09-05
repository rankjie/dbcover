// Generated by CoffeeScript 1.6.3
var EmailValidator, IntegerValidator, StringValidator, Validators, toType;

toType = require('./utils').toType;

Validators = {};

Validators['integer'] = IntegerValidator = (function() {
  function IntegerValidator(min, max) {
    this.min = min;
    this.max = max;
  }

  IntegerValidator.prototype.doValidate = function(num) {
    if (num >= this.min && num <= this.max && toType(num) === 'number') {
      return true;
    }
    return false;
  };

  return IntegerValidator;

})();

Validators['string'] = StringValidator = (function() {
  function StringValidator(minx, max) {
    this.min = min;
    this.max = max;
  }

  StringValidator.prototype.doValidate = function(str) {
    if (str.length >= this.min && str.length <= this.max && toType(str) === 'string') {
      return true;
    }
    console.log('string, 验证失败');
    return false;
  };

  return StringValidator;

})();

Validators['email'] = EmailValidator = (function() {
  function EmailValidator() {}

  EmailValidator.prototype.doValidate = function() {};

  return EmailValidator;

})();

exports.Validators = Validators;