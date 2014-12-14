var redis, redisMethods, _;

redis = require('redis');

_ = require('lodash');

redisMethods = (function() {
  function redisMethods(_config) {
    var config, _host, _options, _port;
    config = _.cloneDeep(_config);
    _host = config.host || null;
    _port = config.port || null;
    delete config.host;
    delete config.port;
    _options = config || null;
    this.client = redis.createClient(_port, _host, _options);
  }

  redisMethods.prototype.set = function(key, row, ttl, callback) {
    var multi;
    if (Object.prototype.toString.call(ttl) === '[object Function]' || ttl < 1) {
      if (Object.prototype.toString.call(ttl) === '[object Function]') {
        callback = ttl;
      }
      return this.client.set(key, row, function(err, replies) {
        if (callback) {
          return callback(err, replies);
        }
      });
    } else {
      return multi = this.client.multi([['set', key, row], ['expire', [key, ttl]]]).exec(function(err, replies) {
        if (callback) {
          return callback(err, replies);
        }
      });
    }
  };

  redisMethods.prototype.get = function(keys, callback) {
    var arr, arrayToObj;
    arr = [];
    if (Object.prototype.toString.call(keys) !== '[object Array]') {
      arr.push(keys);
    } else {
      arr = keys;
    }
    arrayToObj = function(keys, vals) {
      var i, key, obj, _i, _len;
      obj = {};
      for (i = _i = 0, _len = keys.length; _i < _len; i = ++_i) {
        key = keys[i];
        if (vals[i] !== null) {
          obj[key] = vals[i];
        }
      }
      return obj;
    };
    return this.client.mget(arr, function(err, rows) {
      return callback(err, arrayToObj(arr, rows));
    });
  };

  redisMethods.prototype.del = function(keys, callback) {
    return this.client.del(keys, function(err, number_of_rows_deleted) {
      if (callback) {
        return callback(err, number_of_rows_deleted);
      }
    });
  };

  redisMethods.prototype.end = function() {
    return this.client.quit();
  };

  return redisMethods;

})();

module.exports = redisMethods;
