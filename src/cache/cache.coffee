func = []
func['redis']    = require './redis_cache'
func['memcache'] = require './memcache_cache'

module.exports = (config) ->
  return new func[config.type] config.options