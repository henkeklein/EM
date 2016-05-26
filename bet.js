var config = require('./config.json'), //config file contains all tokens and other private info
db = require('orchestrate')(config.db),
moment = require('moment'); //config.db holds Orchestrate token

//Get title, date, creator from event.
exports.getBet = function(req, res) {

  var results = [];

  db.newSearchBuilder()
  .collection('Bet')
  .sort('user', 'asc')
  .query('*')
  .then(function (events){
        events.body.results.forEach(function(obj, i){
          var bet = events.body.results[i]["value"].bet;
          var result = events.body.results[i]["value"].result;
          var user = events.body.results[i]["value"].user;

          results[i] = ([{
            "bet":bet,
            "result":result,
            "user":user,
          }]);
            });
          res.render('infoBet', {user: req.user, res: results});
          });
};
