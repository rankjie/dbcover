memcache = require 'memcached'

class memcacheMethods
  constructor: (config) ->
    serverString = "#{config.host}:#{config.port}"
    delete config.host
    delete config.port
    @mem = new memcache serverString, config.options

  set: (key, row, ttl, callback) ->
    @mem.set key, row, ttl, (err) ->
      callback err, null  if callback

  get: (keys, callback) ->
    @mem.getMulti keys, (err, data) ->
      callback err, data

  del: (key, callback) ->
    @mem.del key, (err) ->
      callback err, null if callback

  end: ->
    @mem.end()

module.exports = memcacheMethods