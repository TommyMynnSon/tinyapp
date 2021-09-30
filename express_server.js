// [ Dependencies ]
const express = require('express');
const cookieSession = require("cookie-session");
const bcryptjs = require('bcryptjs');
const morgan = require('morgan');


// [ Helper Functions ]
const { generateRandomString, isNewEmail, getUserByEmail, urlsForUser } = require('./helpers');


// [ Server Setup ]
const app = express();
const PORT = 8080;
app.set('view engine', 'ejs');


// [ Databases ]
const users = {

};

const urlDatabase = {

};


// [ Middleware ]
app.use(express.urlencoded({ extended: false }));
app.use(cookieSession({
  userId: 'userId',
  keys: ['key1', 'key2']
}));
app.use(morgan('dev'));


// [ GET Request Handlers ]
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/users.json", (req, res) => {
  res.json(users);
});

app.get("/", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];

  let urls = urlsForUser(userId, urlDatabase);

  const templateVars = { urls, user };

  res.render(`urls_index`, templateVars);
});

app.get("/urls", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];

  let urls = urlsForUser(userId, urlDatabase);

  const templateVars = { urls, user };

  res.render(`urls_index`, templateVars);
});

app.get("/urls/new", (req, res) => {
  // Case: not logged in
  if (!req.session.userId) {
    res.statusMessage = "Client is not logged in";
    return res.redirect(`/login`);
  }

  const userId = req.session.userId;
  const user = users[userId];

  const templateVars = { user };

  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  // Case: longURL does does not match to the given shortURL
  if (!urlDatabase[shortURL]) {
    res.statusCode = 404;
    return res.send(`/u/${shortURL} was deleted or never existed in the first place`);
  }

  const longURL = urlDatabase[shortURL].longURL;

  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.userId;
  const user = users[userId];

  // Case: shortURL is invalid
  if (!urlDatabase[shortURL]) {
    res.statusCode = 404;
    return res.send(`/urls/${shortURL} was deleted or never existed in the first place`);
  }

  // Case: shortURL is valid, but client is logged out
  if (!userId) {
    res.statusMessage = "client is not logged in";
    return res.redirect("/login");
  }

  const longURL = urlDatabase[shortURL].longURL;

  const templateVars = { shortURL, longURL, user };

  res.render(`urls_show`, templateVars);
});

app.get("/register", (req, res) => {
  const userId = req.session.userId;

  if (userId) {
    return res.redirect("/urls");
  }

  res.render("registration");
});

app.get("/login", (req, res) => {
  const userId = req.session.userId;

  if (userId) {
    return res.redirect("/urls");
  }

  res.render("login");
});


// [ POST Request Handlers ]
app.post("/urls", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];

  // Case: external POST request (e.g., cURL)
  if (!user) {
    res.statusMessage = "External post request to /urls detected";
    return res.redirect(`/login`);
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  urlDatabase[shortURL] = { longURL, userId };

  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];
  const shortURL = req.params.shortURL;

  // Case: external POST request (e.g., cURL)
  if (!user) {
    res.statusMessage = `External post request to /urls/${shortURL}/delete detected`;
    return res.redirect(`/login`);
  }

  delete urlDatabase[shortURL];

  res.redirect(`/urls`);
});

app.post("/urls/:id", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];

  // Case: external POST request(e.g., cURL)
  if (!user) {
    res.statusMessage = `External post request to /urls/${shortURL} detected`;
    return res.redirect(`/login`);
  }

  const shortURL = req.params.id;
  const newLongURL = req.body.newLongURL;

  urlDatabase[shortURL].longURL = newLongURL;

  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  req.session = null;

  res.redirect(`/urls`);
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcryptjs.hashSync(password, 10);

  // Case: empty email and password
  if (!email && !password) {
    res.statusCode = 400;
    return res.send("Email and password cannot be blank");
  }

  // Case: empty email
  if (!email) {
    res.statusCode = 400;
    return res.send("Email cannot be blank");
  }

  // Case: empty password
  if (!password) {
    res.statusCode = 400;
    return res.send("Password cannot be blank");
  }

  // Case: the given email has already been used to register
  if (!isNewEmail(email, users)) {
    res.statusCode = 400;
    return res.send(`${email} has already been used to register`);
  }

  users[id] = { id, email, hashedPassword };

  req.session.userId = id;

  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = getUserByEmail(email, users);

  // Case: empty email and password
  if (!email && !password) {
    res.statusCode = 400;
    return res.send("Email and password cannot be blank");
  }

  // Case: empty email
  if (!email) {
    res.statusCode = 400;
    return res.send("Email cannot be blank");
  }

  // Case: empty password
  if (!password) {
    res.statusCode = 400;
    return res.send("Password cannot be blank");
  }

  // Case: user with given email cannot be found
  if (!user) {
    res.statusCode = 403;
    return res.send(`${email} is not associated with any user`);
  }

  // Case: valid email, but the given password is wrong
  if (!bcryptjs.compareSync(password, user.hashedPassword)) {
    res.statusCode = 403;
    return res.send(`${password} is not the password for ${email}`);
  }

  req.session.userId = user.id;

  res.redirect(`/urls`);
});


// ---------------------------------------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});