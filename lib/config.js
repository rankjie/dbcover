var config;

exports.config = config = {
  cache: {
    redis: {
      host: 'localhost',
      port: 6379,
      options: {
        database: 0
      }
    },
    memcache: {
      host: '127.0.0.1',
      port: 11212,
      options: {
        someoption: null
      }
    }
  },
  db: {
    mysql: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '78963214',
      database: 'test',
      connectionLimit: 4,
      charset: 'utf8mb4'
    },
    postgres: {
      host: 'localhost',
      port: 5432,
      user: 'jeremy',
      password: '123123',
      database: 'jeremy',
      options: {
        ssl: false,
        poolSize: 4
      }
    }
  }
};
