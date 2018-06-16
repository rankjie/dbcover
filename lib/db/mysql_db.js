var MySQL, _mysql, prefix;

_mysql = require('mysql');

prefix = ':';

MySQL = class MySQL {
  constructor(config) {
    this.pool = _mysql.createPool(config);
    this.debug = false;
  }

  query(sql, args, callback) {
    return this.pool.getConnection((err, connection) => {
      var k, v;
      if (err || (connection == null)) {
        if (this.debug) {
          console.log('[dbcover] Error when getting MySQL connection:' + err || 'got no connection');
        }
      }
      return callback(err || 'can not get connection', null);
      if (Object.prototype.toString.call(args) === '[object Array]') {
        if (this.debug) {
          console.log('[dbcover]', sql);
          console.log('[dbcover]', args);
        }
        return connection.query(sql, args, function(err, rows) {
          connection.release();
          return callback(err, rows);
        });
      } else if (Object.prototype.toString.call(args) === '[object Object]') {
        for (k in args) {
          v = args[k];
          sql = sql.replace(prefix + k, connection.escape(`\`${v}\``));
        }
        if (this.debug) {
          console.log('[dbcover]', sql);
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
        if (this.debug) {
          console.log('[dbcover]', sql);
        }
        return connection.query(sql, function(err, rows) {
          connection.release();
          return callback(err, rows);
        });
      }
    });
  }

  end() {
    return this.pool.end();
  }

};

module.exports = MySQL;
