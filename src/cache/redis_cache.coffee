redis = require 'redis'
_     = require 'lodash'

class redisMethods
  constructor: (_config)->
    config = _.cloneDeep _config
    _host = config.host or null
    _port = config.port or null
    delete config.host
    delete config.port
    _options = config or null
    @client = redis.createClient _port, _host, _options

  set: (key, row, ttl, callback) ->
    if Object.prototype.toString.call(ttl) is '[object Function]' or ttl < 1
      callback = ttl if Object.prototype.toString.call(ttl) is '[object Function]'
      @client.set key, row, (err, replies)->
        callback err, replies if callback
    else
      multi = @client.multi([
        ['set', key, row],
        ['expire', [key, ttl]]
      ]).exec (err, replies)->
        callback err,replies if callback

  get: (keys, callback) ->
    arr = []
    if Object.prototype.toString.call(keys) isnt '[object Array]'
      arr.push keys
    else
      arr = keys
    arrayToObj = (keys, vals) ->
      obj = {}
      for key, i in keys when vals[i] isnt null
        obj[key] = vals[i]
      return obj
    @client.mget arr, (err, rows) ->
      callback err, arrayToObj arr, rows

  del: (keys, callback) ->
    @client.del keys, (err, number_of_rows_deleted) ->
      callback err, number_of_rows_deleted  if callback
  
  end: ->
    @client.quit()


module.exports = redisMethods
