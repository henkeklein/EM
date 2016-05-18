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

app.get('/info', function(req, res){
  res.render('info', {user: req.user});
});

app.get('/contact', function(req, res){
  res.render('contact', {user: req.user});
});

app.get('/post', function(req, res){
  res.render('post', {user: req.user});
});


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
app.get('/p/:id', events.getTopic);
app.get('/attend/:id', function(req, res){
  var attendants;
  db.newSearchBuilder()
  .collection('Event')
  .query(req.param("id"))
  .then(function (events){
    events.body.results.forEach(function(obj ,i){
      attendants = events.body.results[i]["value"].attendants;
      db.merge('Event', req.param("id"),{
        'attendants': attendants + '  ' + fbName(req, res)
      });
    });

  });
  res.redirect('/');
});

app.post('/topic', function(req, res) {
  var title = req.param("title"),
    subject = req.param("subject"),
    date = moment().format('MMMM Do YYYY, h:mm:ss a'),
    datum =req.param("datum"),
    start = req.param("start"),
    end = req.param("end"),
    creator = fbName(req, res),
    attendants = fbName(req, res),
    image = req.param("image")

  db.post('Event', {
    "titles" : title,
    "desc" : subject,
    "date" : date,
    "datum" : datum,
    "start" : start,
    "end" : end,
    "creator": creator,
    "attendants": attendants,
    "image" : image

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
var port = 3333;
app.listen(port);
console.log("listening on " + port + "!");
