var _, redis, redisMethods;

redis = require('redis');

_ = require('lodash');

redisMethods = class redisMethods {
  constructor(_config) {
    var _host, _options, _port, config;
    config = _.cloneDeep(_config);
    _host = config.host || null;
    _port = config.port || null;
    delete config.host;
    delete config.port;
    _options = config || null;
    this.client = redis.createClient(_port, _host, _options);
  }

  set(key, row, ttl, callback) {
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
  }

  get(keys, callback) {
    var arr, arrayToObj;
    arr = [];
    if (Object.prototype.toString.call(keys) !== '[object Array]') {
      arr.push(keys);
    } else {
      arr = keys;
    }
    arrayToObj = function(keys, vals) {
      var i, j, key, len, obj;
      obj = {};
      for (i = j = 0, len = keys.length; j < len; i = ++j) {
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
  }

  del(keys, callback) {
    return this.client.del(keys, function(err, number_of_rows_deleted) {
      if (callback) {
        return callback(err, number_of_rows_deleted);
      }
    });
  }

  end() {
    return this.client.quit();
  }

};

module.exports = redisMethods;
