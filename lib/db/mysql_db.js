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
    var k, self, v;
    self = this;
    if (this.debug) {
      console.log('[dbcover]', sql);
      console.log('[dbcover]', args);
    }
    if (Object.prototype.toString.call(args) === '[object Array]') {
      return self.pool.execute(sql, args);
    } else if (Object.prototype.toString.call(args) === '[object Object]') {
      for (k in args) {
        v = args[k];
        sql = sql.replace(prefix + k, connection.escape(`\`${v}\``));
      }
      return self.pool.execute(sql);
    } else {
      return self.pool.execute(sql);
    }
  }

  end() {
    return this.pool.end();
  }

};

module.exports = MySQL;
