var MySQL, _mysql, prefix;

_mysql = require('mysql');

prefix = ':';

MySQL = (function() {
  function MySQL(config) {
    this.pool = _mysql.createPool(config);
    this.debug = false;
  }

  MySQL.prototype.query = function(sql, args, callback) {
    return this.pool.getConnection((function(_this) {
      return function(err, connection) {
        var k, v;
        if (err || (connection == null)) {
          if (_this.debug) {
            console.log('[dbcover] Error when getting MySQL connection:' + err || 'got no connection');
          }
          return callback(err || 'can not get connection', null);
        }
        if (Object.prototype.toString.call(args) === '[object Array]') {
          if (_this.debug) {
            console.log('[dbcover]', sql);
          }
          if (_this.debug) {
            console.log('[dbcover]', args);
          }
          return connection.query(sql, args, function(err, rows) {
            connection.release();
            return callback(err, rows);
          });
        } else if (Object.prototype.toString.call(args) === '[object Object]') {
          for (k in args) {
            v = args[k];
            sql = sql.replace(prefix + k, "'" + v + "'");
          }
          if (_this.debug) {
            console.log('[dbcover]', sql);
          }
          if (_this.debug) {
            console.log('[dbcover]', args);
          }
          return connection.query(sql, function(err, rows) {
            connection.release();
            return callback(err, rows);
          });
        } else {
          if (callback == null) {
            callback = args;
          }
          if (_this.debug) {
            console.log('[dbcover]', sql);
          }
          return connection.query(sql, function(err, rows) {
            connection.release();
            return callback(err, rows);
          });
        }
      };
    })(this));
  };

  MySQL.prototype.end = function() {
    return this.pool.end();
  };

  return MySQL;

})();

module.exports = MySQL;
