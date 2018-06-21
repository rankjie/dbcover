var MySQL, Q, _mysql, prefix, util;

_mysql = require('mysql2/promise');

Q = require('q');

util = require('util');

prefix = ':';

MySQL = class MySQL {
  constructor(config) {
    this.query = this.query.bind(this);
    // console.log config
    this.pool = _mysql.createPool(config);
    // console.log @pool
    this.debug = false;
  }

  query(sql, args) {
    var self;
    self = this;
    if (this.debug) {
      console.log('[dbcover]', sql);
      console.log('[dbcover]', args);
    }
    return self.pool.getConnection().then(function(connection) {
      var k, res, v;
      if (Object.prototype.toString.call(args) === '[object Array]') {
        res = connection.query(sql, args);
      } else {
        if (Object.prototype.toString.call(args) === '[object Object]') {
          for (k in args) {
            v = args[k];
            sql = sql.replace(prefix + k, connection.escape(`\`${v}\``));
          }
        }
        res = connection.query(sql);
      }
      return res.then(function(ret) {
        connection.release();
        return Q(ret[0]);
      }, function(e) {
        connection.release();
        return Q.reject(e);
      });
    }).catch(function(e) {
      console.error('[dbcover]', e);
      return Q.reject(e);
    });
  }

  end() {
    return this.pool.end();
  }

};

module.exports = MySQL;
