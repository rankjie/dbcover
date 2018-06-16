var Directory, File, Group, Model, Observe, Q, User, Validators, d, mysql, redis;

({Model} = require('../model'));

({Observe} = require('../model'));

({Validators} = require('../model'));

Q = require('q');

({redis} = require('/Volumes/Files/Documents/work/upcloud/src/routes/config'));

({mysql} = require('/Volumes/Files/Documents/work/upcloud/src/routes/config'));

Observe.define('repo', {
  name: 'default',
  provider: {
    type: 'mysql',
    options: mysql
  }
});

Observe.define('cache', {
  name: 'default',
  provider: {
    type: 'redis',
    options: redis
  }
});

exports.User = User = new Model({
  meta: {
    table: 'upcloud_user',
    repo: 'default',
    // cache: 'redis'
    fields: [
      {
        name: 'id',
        type: 'integer',
        primkey: true,
        wait: true
      },
      {
        name: 'email',
        type: 'string'
      },
      {
        name: 'password',
        type: 'string'
      },
      {
        name: 'group_ids',
        type: 'json'
      },
      {
        name: 'created_at',
        type: 'timestamp'
      },
      {
        name: 'updated_at',
        type: 'timestamp'
      }
    ]
  }
});

exports.Group = Group = new Model({
  meta: {
    table: 'upcloud_group',
    repo: 'default',
    // cache: 'redis'
    fields: [
      {
        name: 'id',
        type: 'integer',
        primkey: true,
        wait: true
      },
      {
        name: 'name',
        type: 'string'
      },
      {
        name: 'user_ids',
        type: 'json'
      },
      {
        name: 'owner_id',
        type: 'integer'
      },
      {
        name: 'admin_ids',
        type: 'json'
      },
      {
        name: 'created_at',
        type: 'timestamp'
      },
      {
        name: 'updated_at',
        type: 'timestamp'
      }
    ]
  }
});

exports.File = File = new Model({
  meta: {
    table: 'upcloud_file',
    repo: 'default',
    // cache: 'redis'
    fields: [
      {
        name: 'id',
        type: 'integer',
        primkey: true,
        wait: true
      },
      {
        name: 'name',
        type: 'string'
      },
      {
        name: 'user_id',
        type: 'integer'
      },
      {
        name: 'group_id',
        type: 'integer'
      },
      {
        name: 'parent_directory_id',
        type: 'integer'
      },
      {
        name: 'group_parent_directory_id',
        type: 'integer'
      },
      {
        name: 'version_of',
        type: 'integer'
      },
      {
        name: 'private',
        type: 'string'
      },
      {
        name: 'bucket',
        type: 'string'
      },
      {
        name: 'uri',
        type: 'string'
      },
      {
        name: 'status',
        type: 'string'
      },
      {
        name: 'created_at',
        type: 'timestamp'
      },
      {
        name: 'updated_at',
        type: 'timestamp'
      }
    ]
  },
  deleteAll: function(file_id) {
    var deferred, raw_sql;
    deferred = Q.defer();
    raw_sql = `DELETE FROM ${this.$table} WHERE id = ? OR version_of = ?`;
    return this.$repo.query(raw_sql, [file_id, file_id], function(err, result) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(result);
      }
      return deferred.promise;
    });
  }
});

exports.Directory = Directory = new Model({
  meta: {
    table: 'upcloud_directory',
    repo: 'default',
    // cache: 'redis'
    fields: [
      {
        name: 'id',
        type: 'integer',
        primkey: true,
        wait: true
      },
      {
        name: 'user_id',
        type: 'integer'
      },
      {
        name: 'group_id',
        type: 'integer'
      },
      {
        name: 'name',
        type: 'string'
      },
      {
        // {name: 'sub_directory_idss', type: 'json'}
        name: 'parent_directory_id',
        type: 'integer'
      },
      {
        name: 'group_parent_directory_id',
        type: 'integer'
      },
      {
        // {name: 'file_ids', type: 'json'}
        name: 'created_at',
        type: 'timestamp'
      },
      {
        name: 'updated_at',
        type: 'timestamp'
      }
    ]
  },
  sayHi: function() {
    return console.log('hi~~');
  }
});

d = Group.new({
  name: 'Gggroup',
  user_ids: [123123, 123123],
  admin_ids: [1, 2]
});

d.sayHi();

Group.sayHi();

// a = []

// a.push Group.find(
//   id: 1
// ).first()

// a.push Group.find(
//   id: 3
// ).first()

// p = Q.all a

// p.then (res)->
//   console.log res[0]
// , (err)->
//   console.log err
