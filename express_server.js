const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// add morgan for logging
const morgan = require('morgan');
app.use(morgan('dev'));

// const cookieParser = require('cookie-parser');
// const { response } = require("express");
// app.use(cookieParser());

var cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  keys: ['zO2xF2xzitMI8rtGgAPQ'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

const bcrypt = require('bcrypt');

const { getUserByEmail } = require('./helpers');

const urlDatabase = {
  b6UTxQ: { longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = { 
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    password: "$2b$10$xFpTYaj3A.VQZeqUZUFqzuevvkLzg3TUkhUlfNUA06rR4UaaMyUxy"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2b$10$HE5CVyoxvPaO.YrHXpVPFO.vf7gV6QDGn0ZKoN8zGVLoVfhpQmFw."
  }
};

// returns a random string of 6 characters
const generateRandomString = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomChars = [];

  for (let i = 0; i < 6; i++) {
    randomChars.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  return randomChars.join('');
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get('/register', (req, res) => {
  console.log('users', users);

  const templateVars = {
    // user: users[req.cookies['user_id']],
    user: users[req.session.user_id],
  };

  res.render('register', templateVars);
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
  } else {
    res.redirect(400, '/register');
  }
});

app.get('/login', (req, res) => {
  const templateVars = {
    // user: users[req.cookies['user_id']],
    user: users[req.session.user_id],
    urls: urlDatabase
  };

  res.render("login", templateVars);
});

app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users);

  if(!req.body.email || !req.body.password || !user) {
    res.redirect(403, '/login');
  } else {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      // res.cookie('user_id', user.id);
      req.session.user_id = user.id;
      res.redirect('/urls');
    } else {
      res.redirect(403, '/login');
    }
  }
});

app.post('/logout', (req, res) => {
  // res.clearCookie('user_id');
  req.session = null;
  res.redirect('/urls');
});


const urlsForUser = (userID) => {
  const userURLs = {};
  for (url in urlDatabase) {
    if (urlDatabase[url].userID === userID) {
      userURLs[url] = urlDatabase[url];
    }
  }
  console.log(userURLs);
  return userURLs;
};

app.get("/urls", (req, res) => {
  const templateVars = {
    // user: users[req.cookies['user_id']],
    user: users[req.session.user_id],
    // urls: urlsForUser(req.cookies['user_id'])
    urls: urlsForUser(req.session.user_id)
  };

  res.render("urls_index", templateVars);
});

const isValidUser = (userID) => {
  for (user in users) {
    if (users[userID]) {
      return true;
    }
  }
  return false;
};

// POST request for new URL
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console

  // if (req.cookies['user_id'] && isValidUser(req.cookies['user_id'])) {
  if (req.session.user_id && isValidUser(req.session.user_id)) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      // userID: req.cookies['user_id']
      userID: req.session.user_id
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.redirect('403', '/login');
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
  console.log(req.body);

  // if (req.cookies['user_id'] && isValidUser(req.cookies['user_id']) && urlBelongsToUser(req.cookies['user_id'], req.params.shortURL)) {
  if (req.session.user_id && isValidUser(req.session.user_id) && urlBelongsToUser(req.session.user_id, req.params.shortURL)) {
    urlDatabase[req.params.shortURL] = {
      longURL: req.body.longURL,
      // userID: req.cookies['user_id']
      userID: req.session.user_id
    };
    res.redirect(`/urls`);
  } else {
    res.redirect(403, '/login');
  }
});

// Add a POST route that removes a URL resource
app.post("/urls/:shortURL/delete", (req, res) => {
  console.log(req.body);

  // if (req.cookies['user_id'] && isValidUser(req.cookies['user_id']) && urlBelongsToUser(req.cookies['user_id'], req.params.shortURL)) {
  if (req.session.user_id && isValidUser(req.session.user_id) && urlBelongsToUser(req.session.user_id, req.params.shortURL)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect(`/urls`);
  } else {
    res.redirect(403, '/login');
  }
});

const findUserByID = (userID) => {
  if (users[userID]) {
    return users[userID]
  } else {
    return null;
  }
};

app.get("/urls/new", (req, res) => {
  // const user = findUserByID(req.cookies.user_id);
  const user = findUserByID(req.session.user_id);

  if (user) {
    const templateVars = {
      // user: users[req.cookies['user_id']],
      user: users[req.session.user_id],
      urls: urlDatabase
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/:shortURL", (req, res) => {
  // const urls = urlsForUser(req.cookies['user_id']);
  const urls = urlsForUser(req.session.user_id);
  
  const templateVars = {
    // user: users[req.cookies['user_id']],
    user: users[req.session.user_id],
    shortURL: req.params.shortURL,
    url: urls[req.params.shortURL],
  };

  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/users.json", (req, res) => {
  res.json(users);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
