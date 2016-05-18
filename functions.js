var bcrypt = require('bcryptjs'),
    Q = require('q'),
    config = require('./config.json'), //config file contains all tokens and other private info
    db = require('orchestrate')(config.db); //config.db holds Orchestrate token

exports.fbLogin = function(id, name) {
  var deferred = Q.defer();
  var user = {
    "ID" : id,
    "Name" : name,
  }

  db.get('fb-users', name)
  .then(function (result) {
    deferred.resolve(false);
    console.log(name + " already exist in DB");
  })
  .fail(function (result) { // If the user does not exist, we save the person
    console.log('Saving new user in DB');
    db.put('fb-users', name, user)
    .then(function() {
      console.log(name + " saved in DB");
      deferred.resolve(user);
    })
  });
  return deferred.promise;
}
