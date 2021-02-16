const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// add morgan for logging
const morgan = require('morgan');
app.use(morgan('dev'));

const cookieParser = require('cookie-parser');
const { response } = require("express");
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
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
    user: users[req.cookies['user_id']],
    urls: urlDatabase
  };

  res.render('register', templateVars);
});

const isValidRegistration = (email, password) => {
  // check if email or password are missing
  if(!email || !password) {
    return false;
  } 

  // check if email is already in use
  console.log('email:', email);
  for (user in users) {
    console.log('user obj:', users[user].email);
    if (users[user].email === email) {
      console.log('returning false')
      return false;
    }
  }

  // if we get here, all is good
  return true;
};

app.post('/register', (req, res) => {
  // console.log('body:', req.body);

  if (isValidRegistration(req.body.email, req.body.password)) {
    const newUserID = generateRandomString();
  
    users[newUserID] = {
      id: newUserID,
      email: req.body.email,
      password: req.body.password
    };
  
    res.cookie('user_id', newUserID);
    res.redirect('/urls');
  } else {
    res.redirect(400, '/register');
  }
});

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']],
    urls: urlDatabase
  };

  res.render("urls_index", templateVars);
});

// POST request for new URL
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;

  res.redirect(`/urls/${shortURL}`);
});

// Add a POST route that edits a URL resource
app.post("/urls/:shortURL", (req, res) => {
  console.log(req.body);

  urlDatabase[req.params.shortURL] = req.body.longURL;
  
  res.redirect(`/urls`);
});

// Add a POST route that removes a URL resource
app.post("/urls/:shortURL/delete", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  
  delete urlDatabase[req.params.shortURL];

  res.redirect(`/urls`);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']],
    urls: urlDatabase
  };

  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };

  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
