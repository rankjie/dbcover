toType = (obj)->
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()


exports.toType = toType