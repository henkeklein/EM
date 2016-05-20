var config = require('./config.json'), //config file contains all tokens and other private info
db = require('orchestrate')(config.db),
moment = require('moment'); //config.db holds Orchestrate token

//Get title, date, creator from event.
exports.getEvent = function(req, res) {

  var result = [];

  db.newSearchBuilder()
  .collection('Event')
  .sort('datum', 'asc')
  .query('*')
  .then(function (events){
        events.body.results.forEach(function(obj, i){
          var date = events.body.results[i]["value"].datum;
          var image = events.body.results[i]["value"].image;
          var hometeam = events.body.results[i]["value"].hometeam;
          var awayteam = events.body.results[i]["value"].awayteam;
          var location = events.body.results[i]["value"].location;
          var time = events.body.results[i]["value"].time;
          var tv = events.body.results[i]["value"].tv;
          var key = events.body.results[i].path.key;

          result[i] = ([{
            "hometeam":hometeam,
            "awayteam":awayteam,
            "location":location,
            "date" : date,
            "time" : time,
            "tv" : tv,
            "image" : image,
            "key" : key
          }]);
            });
          res.render('home', {user: req.user, title: result});
          });
};
