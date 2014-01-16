memcache = require 'memcached'
_        = require 'lodash'
{toType} = require '../utils'

class memcacheMethods
  constructor: (_config) ->
    config = _.cloneDeep _config
    serverString = "#{config.host}:#{config.port}"
    delete config.host
    delete config.port
    @mem = new memcache serverString, config.options
    # if Object.keys(config).length isnt 0
    #   # console.log config
    #   @mem = new memcache serverString, config.options
    # else
    #   console.log '空了'
    #   @mem = new memcache serverString

  set: (key, row, ttl, callback) ->
    _ttl = ttl
    unless callback?
      _ttl = 0
      callback = ttl
    @mem.set key, row, _ttl, (err) ->
      callback err, null  if callback

  get: (keys, callback) ->
    if toType(keys) is 'string' 
      k = []
      k.push keys
      @mem.getMulti k, (err, data) ->
        callback err, data
    else
      @mem.getMulti keys, (err, data) ->
        callback err, data

  del: (key, callback) ->
    @mem.del key, (err) ->
      callback err, null if callback

  end: ->
    @mem.end()

module.exports = memcacheMethods