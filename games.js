var config = require('./config.json'), //config file contains all tokens and other private info
db = require('orchestrate')(config.db),
moment = require('moment'); //config.db holds Orchestrate token

//Get title, date, creator from event.
exports.getGames = function(req, res) {

  var result = [];

  db.newSearchBuilder()
  .collection('Games')
  .sort('number', 'asc')
  .query('*')
  .then(function (events){
        events.body.results.forEach(function(obj, i){
          var number = events.body.results[i]["value"].number;
          var gameName = events.body.results[i]["value"].gameName;

          result[i] = ([{
            "number":number,
            "gameName":gameName,
          }]);
            });
          res.render('postBet', {user: req.user, res: result});
          });
};
