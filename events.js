var config = require('./config.json'), //config file contains all tokens and other private info
db = require('orchestrate')(config.db),
moment = require('moment'); //config.db holds Orchestrate token

//Get title, date, creator from event.
exports.getEvent = function(req, res) {

  var result = [];

  db.newSearchBuilder()
  .collection('Event')
  .query('*')
  .then(function (events){
        events.body.results.forEach(function(obj, i){
          var title = events.body.results[i]["value"].titles;
          var date = events.body.results[i]["value"].datum;
          var creator = events.body.results[i]["value"].creator;
          var image = events.body.results[i]["value"].image;
          var key = events.body.results[i].path.key;

          result[i] = ([{
            "title" : title,
            "date" : date,
            "creator" : creator,
            "image" : image,
            "key" : key
          }]);
            });
          res.render('home', {user: req.user, title: result});
          });
};
//Get everything from events database.
exports.getTopic = function(req, res) {
  db.newSearchBuilder()
  .collection('Event')
  .query(req.param("id"))
  .then(function(events){

      events.body.results.forEach(function (obj, index){
      events.body.results[index].titles;

      res.render('infoEvent', {
       user: req.user,
       users: events.body.results,
       title: events.body.results[index]["value"].titles,
       desc: events.body.results[index]["value"].desc,
       date: events.body.results[index]["value"].date,
       start: events.body.results[index]["value"].start,
       end: events.body.results[index]["value"].end,
       creator: events.body.results[index]["value"].creator,
       attendants: events.body.results[index]["value"].attendants
     });
    });
})
  .fail(function (err) {
    console.log(err); // prints error
  });
};
