func = []
func['mysql']     = require './mysql_db'
func['postgresql']  = require './postgres_db'

module.exports = (config) ->
  return new func[config.type] config.options