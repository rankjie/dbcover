redis = require 'ioredis'
_     = require 'lodash'
Q     = require 'q'

class redisMethods
  constructor: (_config)->
    config = _.cloneDeep _config
    _host = config.host or null
    _port = config.port or null
    delete config.host
    delete config.port
    _options = config or null
    @client = new redis(_port, _host, _options)

  set: (key, row, ttl) ->
    if not ttl
      @client.set key, row
    else
      @client.set key, row, 'EX', ttl

  get: (keys) ->
    arr = keys
    if Object.prototype.toString.call(keys) isnt '[object Array]'
      arr = [keys]
    arrayToObj = (keys, vals) ->
      obj = {}
      for key, i in keys when vals[i]?
        obj[key] = vals[i]
      return obj
    @client.mget arr
    .then (rows)->
      Q(arrayToObj arr, rows)

  del: (keys, callback) ->
    @client.del keys
  
  end: ->
    @client.quit()

module.exports = redisMethods
