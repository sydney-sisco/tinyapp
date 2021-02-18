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

const { getUserByEmail, generateRandomString } = require('./helpers');

// database objects
const urlDatabase = {};
const users = {};

app.get("/", (req, res) => {
  if (isValidUser(req.session.user_id)) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: users[req.session.user_id],
    };
    res.render('register', templateVars);
  }
});

app.post('/register', (req, res) => {

  if (req.body.email && req.body.password && !getUserByEmail(req.body.email, users)) {
    const newUserID = generateRandomString();
  
    users[newUserID] = {
      id: newUserID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
  
    req.session.user_id = newUserID;
    res.redirect('/urls');
  } else if (!req.body.email || !req.body.password) {
    const templateVars = {
      user: users[req.session.user_id],
      urls: urlDatabase,
      errorString: 'You must provide an email and password to register.'
    };
    res.status(400).render('error', templateVars);
  } else {
    const templateVars = {
      user: users[req.session.user_id],
      urls: urlDatabase,
      errorString: 'Email is already in use.'
    };
    res.status(400).render('error', templateVars);
  }
});

app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: users[req.session.user_id],
      urls: urlDatabase
    };
  
    res.render("login", templateVars);
  }
});

app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users);

  if (!req.body.email || !req.body.password || !user) {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'Login failed, try again.'
    };
    res.status(403).render('error', templateVars);
  } else {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      req.session.user_id = user.id;
      res.redirect('/urls');
    } else {
      const templateVars = {
        user: users[req.session.user_id],
        errorString: 'Login failed, try again.'
      };
      res.status(403).render('error', templateVars);
    }
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});


const urlsForUser = (userID) => {
  const userURLs = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === userID) {
      userURLs[url] = urlDatabase[url];
    }
  }
  return userURLs;
};

app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id)
  };

  res.render("urls_index", templateVars);
});

const isValidUser = (userID) => {
  for (const user in users) {
    if (users[userID]) {
      return true;
    }
  }
  return false;
};

// POST request for new URL
app.post("/urls", (req, res) => {

  if (req.session.user_id && isValidUser(req.session.user_id)) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'Sorry, you do not have access to this.'
    };
    res.status(403).render('error', templateVars);
  }
});

const urlBelongsToUser = (userID, shortURL) => {
  const urls = urlsForUser(userID);

  for (const url in urls) {
    if (url === shortURL) {
      return true;
    }
  }
  return false;
};

// Add a POST route that edits a URL resource
app.post("/urls/:shortURL", (req, res) => {

  if (req.session.user_id && isValidUser(req.session.user_id) && urlBelongsToUser(req.session.user_id, req.params.shortURL)) {
    urlDatabase[req.params.shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id
    };
    res.redirect(`/urls`);
  } else {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'Sorry, you do not have access to this.'
    };
    res.status(403).render('error', templateVars);
  }
});

// Add a POST route that removes a URL resource
app.post("/urls/:shortURL/delete", (req, res) => {

  if (req.session.user_id && isValidUser(req.session.user_id) && urlBelongsToUser(req.session.user_id, req.params.shortURL)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect(`/urls`);
  } else {
    const templateVars = {
      user: users[req.session.user_id],
      errorString: 'Sorry you do not have access to this.'
    };
    res.render('error', templateVars);
  }
});

const findUserByID = (userID) => {
  if (users[userID]) {
    return users[userID];
  } else {
    return null;
  }
};

app.get("/urls/new", (req, res) => {
  const user = findUserByID(req.session.user_id);

  if (user) {
    const templateVars = {
      user: users[req.session.user_id],
      urls: urlDatabase
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const urls = urlsForUser(req.session.user_id);
  
  const templateVars = {
    user: users[req.session.user_id],
    shortURL: req.params.shortURL,
    url: urls[req.params.shortURL],
  };

  res.render("urls_show", templateVars);
});

// TODO: remove this
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// TODO: remove this
app.get("/users.json", (req, res) => {
  res.json(users);
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.status(404).render('error_404', templateVars);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
