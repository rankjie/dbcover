var func;

func = [];

func['redis'] = require('./redis_cache');

module.exports = function(config) {
  return new func[config.type](config.options);
};
