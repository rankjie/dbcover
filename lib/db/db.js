// Generated by CoffeeScript 2.5.1
var func;

func = [];

func['mysql'] = require('./mysql_db');

func['postgresql'] = require('./postgres_db');

module.exports = function(config) {
  return new func[config.type](config.options);
};
