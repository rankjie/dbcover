class User
  constructor: (byWhat)->
    for key in byWhat

      User.prototype[key] = ()->
        

u = new User ['a','b']


u.prototype.key()