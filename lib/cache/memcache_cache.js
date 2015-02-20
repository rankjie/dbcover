var _, memcache, memcacheMethods, toType;

memcache = require('memcached');

_ = require('lodash');

toType = require('../utils').toType;

memcacheMethods = (function() {
  function memcacheMethods(_config) {
    var config, serverString;
    config = _.cloneDeep(_config);
    serverString = config.host + ":" + config.port;
    delete config.host;
    delete config.port;
    this.mem = new memcache(serverString, config.options);
  }

  memcacheMethods.prototype.set = function(key, row, ttl, callback) {
    var _ttl;
    _ttl = ttl;
    if (callback == null) {
      _ttl = 0;
      callback = ttl;
    }
    return this.mem.set(key, row, _ttl, function(err) {
      if (callback) {
        return callback(err, null);
      }
    });
  };

  memcacheMethods.prototype.get = function(keys, callback) {
    var k;
    if (toType(keys) === 'string') {
      k = [];
      k.push(keys);
      return this.mem.getMulti(k, function(err, data) {
        return callback(err, data);
      });
    } else {
      return this.mem.getMulti(keys, function(err, data) {
        return callback(err, data);
      });
    }
  };

  memcacheMethods.prototype.del = function(key, callback) {
    return this.mem.del(key, function(err) {
      if (callback) {
        return callback(err, null);
      }
    });
  };

  memcacheMethods.prototype.end = function() {
    return this.mem.end();
  };

  return memcacheMethods;

})();

module.exports = memcacheMethods;
