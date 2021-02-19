const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// add morgan for logging
const morgan = require('morgan');
app.use(morgan('dev'));

// use cookie-session for encrypted cookies
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['zO2xF2xzitMI8rtGgAPQ'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// use bcrypt to hash passwords
const bcrypt = require('bcrypt');

// set up methodOverride to override with POST having ?_method=DELETE
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

const { getUserByEmail, generateRandomString, getURLsByUser, countUniqueVisitors } = require('./helpers');

// database objects
const urlDatabase = {};
const users = {};


// requests to root should be redirected
app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
    return;
  }
  res.redirect('/urls');
});

// Register GET
app.get('/register', (req, res) => {
  
  // if the user is already logged in, redirect them
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }

  // otherwise, show them the register page
  const templateVars = {
    user: users[req.session.user_id],
  };
  res.render('register', templateVars);
});

// Register POST
app.post('/register', (req, res) => {

  // if email or password are missing, show error
  if (!req.body.email || !req.body.password) {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'You must provide an email and password to register.'
    };
    res.status(400).render('error', templateVars);
    return;
  }

  // if email is already in use, show error
  if (getUserByEmail(req.body.email, users)) {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'Email is already in use.'
    };
    res.status(400).render('error', templateVars);
    return;
  }

  // register the user and log them in
  const newUserID = generateRandomString();
  
  users[newUserID] = {
    id: newUserID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  req.session.user_id = newUserID;
  res.redirect('/urls');
});

// Login GET
app.get('/login', (req, res) => {

  // if the user is already logged in, redirect them
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }

  const templateVars = {
    user: users[req.session.user_id],
  };
  res.render("login", templateVars);
});

// Login POST
app.post('/login', (req, res) => {

  // if email or password are missing, show error
  if (!req.body.email || !req.body.password) {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'You must provide an email and password to login.'
    };
    res.status(403).render('error', templateVars);
    return;
  }

  // look up the user in the database. Returns null if no user found
  const user = getUserByEmail(req.body.email, users);

  // if the email is incorrect, show error
  if (!user) {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'Invalid username or password.'
    };
    res.status(403).render('error', templateVars);
    return;
  }
  
  // if the password is incorrect, show error
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'Invalid username or password.'
    };
    res.status(403).render('error', templateVars);
    return;
  }
  
  // log the user in and redirect them
  req.session.user_id = user.id;
  res.redirect('/urls');
});

// Logout POST
app.post('/logout', (req, res) => {
  // clear cookies, EZ.
  req.session = null;
  res.redirect('/urls');
});

// URLs GET - Listing of user's URLs
app.get("/urls", (req, res) => {

  // if the user is not logged in, show error
  if (!req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'Please log in to view your URLs.'
    };
    res.status(403).render('error', templateVars);
    return;
  }

  // render the page
  const templateVars = {
    countUniqueVisitors,
    user: users[req.session.user_id],
    urls: getURLsByUser(req.session.user_id, urlDatabase)
  };

  res.render("urls_index", templateVars);
});

// create a new URL
app.post("/urls", (req, res) => {

  // if user is not logged in, show error
  if (!req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'Sorry, you do not have access to this.'
    };
    res.status(403).render('error', templateVars);
    return;
  }

  // create a new URL and add it to the database
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id,
    dateCreated: Date.now(),
    visits: []
  };
  res.redirect(`/urls/${shortURL}`);
});

// Edit a URL
app.put("/urls/:shortURL", (req, res) => {

  // if the user is not logged in, show error
  if (!req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'You must be logged in to do this.'
    };
    res.status(403).render('error', templateVars);
    return;
  }
  
  // if the user does not own the URL, show error
  if (!getURLsByUser(req.session.user_id, urlDatabase)[req.params.shortURL]) {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'Sorry, you do not have access to this.'
    };
    res.status(403).render('error', templateVars);
    return;
  }

  // edit the URL and redirect the user
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect(`/urls`);
});

// Delete a URL
app.delete("/urls/:shortURL", (req, res) => {

  // if the user is not logged in, show error
  if (!req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'You must be logged in to do this.'
    };
    res.status(403).render('error', templateVars);
    return;
  }

  // if the user does not own the URL, show error
  if (!getURLsByUser(req.session.user_id, urlDatabase)[req.params.shortURL]) {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'Sorry, you do not have access to this.'
    };
    res.status(403).render('error', templateVars);
    return;
  }

  // delete the URL and redirect the user
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

// form to create a new URL
app.get("/urls/new", (req, res) => {

  // if the user is not logged in, redirect to login
  if (!req.session.user_id) {
    res.redirect('/login');
    return;
  }

  const templateVars = {
    user: users[req.session.user_id],
    urls: urlDatabase
  };
  res.render("urls_new", templateVars);
});

// show details of a specific URL
app.get("/urls/:shortURL", (req, res) => {

  // if the user is not logged in, show error
  if (!req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'You must be logged in to do this.'
    };
    res.status(403).render('error', templateVars);
    return;
  }
  
  // if the URL does not exist, show error
  if (!urlDatabase[req.params.shortURL]) {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'This URL does not exist.'
    };
    res.status(404).render('error', templateVars);
    return;
  }

  // if the user does not own the URL, show error
  if (!getURLsByUser(req.session.user_id, urlDatabase)[req.params.shortURL]) {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'Sorry, you do not have access to this.'
    };
    res.status(403).render('error', templateVars);
    return;
  }

  // render the page
  const templateVars = {
    countUniqueVisitors,
    user: users[req.session.user_id],
    shortURL: req.params.shortURL,
    url: urlDatabase[req.params.shortURL],
  };
  res.render("urls_show", templateVars);
});

// route used to redirect short URLs to long URLs
app.get("/u/:shortURL", (req, res) => {

  // if the URL does not exist, show error
  if (!urlDatabase[req.params.shortURL]) {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'This URL does not exist.'
    };
    res.status(404).render('error', templateVars);
    return;
  }

  // analytics
  //if the user doesn't have a visitorID cookie, set one
  if (!req.session.visitorID) {
    const newVisitorID = generateRandomString();
    req.session.visitorID = newVisitorID;
  }

  //log the visit
  urlDatabase[req.params.shortURL].visits.push({
    date: Date.now(),
    visitorID: req.session.visitorID
  });
  
  // finally, redirect to the corresponding long URL
  let longURL = urlDatabase[req.params.shortURL].longURL;
  if (longURL.substring(0, 4) !== 'http') {
    longURL = 'http://' + longURL;
  }
  res.status(302).redirect(longURL);
});

// start the server!
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
