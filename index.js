var express = require('express'),
    exphbs  = require('express3-handlebars'),
    passport = require('passport'),
    LocalStrategy = require('passport-local'),
    moment = require('moment'),
    FacebookStrategy = require('passport-facebook').Strategy;


var config = require('./config.json'), //config file contains all tokens and other private info
    funct = require('./functions.js');
    fbAuth = require('./fbAuth.json');
    events = require('./events.js');
    games = require('./games.js');
    bet = require('./bet.js');
    db = require('orchestrate')(config.db);

var app = express();

var fbName = function(req,res) {
  return req.user.displayName;
};

 app.use(express.static(__dirname + '/styles'));
 app.use(express.static(__dirname + '/maps'));
 app.use(express.static(__dirname + '/images'));


//===============PASSPORT=================

// Passport session setup.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use Facebook to login
passport.use(new FacebookStrategy({
    clientID: fbAuth.clientID,
    clientSecret: fbAuth.clientSecret,
    callbackURL: fbAuth.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
     process.nextTick(function(id, name) {

        var name = profile.displayName;
        var id = profile.id;

        funct.fbLogin(id, name)
        console.log("Logged in as " + name);

    });
    return done(null, profile);
  }

));


// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  req.session.error = 'Please sign in!';
  res.redirect('/signin');
}


function event(req, res, next) {
      if (event) {
        console.log("Create an event " + user.event);
        req.session.success = 'The event where successfully created ' + user.username + '!';
        done(null, user);
      }
      if (!event) {
        console.log("Could not creata an event");
        req.session.error = 'Could not creata an event. Please try again.';
        done(null, event);
    }
  }


//===============EXPRESS=================

// Configure Express
app.use(express.logger());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.session({ secret: 'supernova' }));
app.use(passport.initialize());
app.use(passport.session());

//========================================

// Session-persisted message middleware
app.use(function(req, res, next){
  var err = req.session.error,
      msg = req.session.notice,
      success = req.session.success;

  delete req.session.error;
  delete req.session.success;
  delete req.session.notice;

  if (err) res.locals.error = err;
  if (msg) res.locals.notice = msg;
  if (success) res.locals.success = success;

  next();
});

app.use(app.router);

// Configure express to use handlebars templates
var hbs = exphbs.create({
    defaultLayout: 'main',
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');


//===============ROUTES=================

app.get('/maps', function(req, res){
   res.render('maps', {user: req.user});
});

//displays our signup page
app.get('/signin', function(req, res){
  res.render('signin');
});

app.get('/post', function(req, res){
  res.render('post', {user: req.user});
});
app.get('/infoBet', bet.getBet)

app.get('/postBet', games.getGames)


//sends the request through our local signup strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/local-reg', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/signin'
  })
);

//sends the request through our local login/signin strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/login', passport.authenticate('local-signin', {
  successRedirect: '/',
  failureRedirect: '/signin'
  })
);
app.get('/', events.getEvent);

app.post('/topic', function(req, res) {

  var hometeam = req.param("hometeam"),
      awayteam = req.param("awayteam"),
      image = req.param("image"),
      datum =req.param("datum"),
      location= req.param("location"),
      time = req.param("time"),
      tv = req.param("tv")

  db.post('Event', {
    "hometeam" : hometeam,
    "awayteam" : awayteam,
    "image" : image,
    "datum" : datum,
    "location" : location,
    "time": time,
    "tv": tv,

  })
  .then(function (result) {
    var responseKey = result.headers.location.split("/")[3];
    res.redirect('/');
  })
  .fail(function (err) {

  });
});

app.post('/bet', function(req, res) {

  var bet = req.param("bet"),
      result = req.param("result"),
      user = fbName(req, res),
      winner = req.param("winner")

  db.post('Bet', {
    "bet" : bet,
    "result" : result,
    "user" : user,
    "winner" : winner,

  })
  .then(function (result) {
    var responseKey = result.headers.location.split("/")[3];
    res.redirect('/');
  })
  .fail(function (err) {

  });
});

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
       successRedirect : '/',
       failureRedirect: '/login'
  }),
  function(req, res) {
    res.redirect('/');
  });

//logs user out of site, deleting them from the session, and returns to homepage
app.get('/logout', function(req, res){
  var name = fbName(req,res);
  console.log("Logged out " + name + " with ID: " + req.user.id);
  req.logout();
  res.redirect('/');
  req.session.notice = "You have successfully been logged out " + name + "!";
});


//===============PORT=================
var port = process.env.PORT || 3333;
app.listen(port);
console.log("listening on " + port + "!");
