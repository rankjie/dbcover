// Generated by CoffeeScript 1.6.3
var Model, Observe, User, Validators, u;

Model = require('../model').Model;

Observe = require('../model').Observe;

Validators = require('../validators').Validators;

Observe.define('repo', {
  name: 'mysql',
  provider: {
    type: 'mysql',
    options: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '123123',
      database: 'test',
      connectionLimit: 4
    }
  }
});

Observe.define('repo', {
  name: 'pg',
  provider: {
    type: 'postgresql',
    options: {
      host: 'localhost',
      port: 5432,
      user: 'jeremy',
      password: '123123',
      database: 'jeremy'
    }
  }
});

Observe.define('cache', {
  name: 'default',
  provider: {
    type: 'redis',
    options: {
      host: 'localhost',
      port: 6379
    }
  }
});

User = new Model({
  meta: {
    table: 'work',
    repo: 'mysql',
    cache: 'default',
    fields: [
      {
        name: 'userId',
        type: 'string',
        column: 'id',
        required: true
      }, {
        name: 'name',
        type: 'string',
        validator: null
      }, {
        name: 'age',
        type: 'integer',
        validator: new Validators.integer(1, 100)
      }
    ],
    indices: [
      {
        name: 'id',
        fields: ['userId'],
        unique: true
      }
    ]
  },
  sayHi: function() {
    return console.log('hi');
  }
});

u = User["new"]({
  userId: 88,
  name: '一号测试人员',
  age: 99
});

u.sayHi();

u.save();