// [ Dependencies ]
const express = require('express');
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcryptjs = require('bcryptjs');

// [ Databases ]
const { usersDatabase, urlDatabase } = require('./database');

// [ Helper Functions ]
const { generateRandomString, isNewEmail, getUserByEmail, urlsForUser } = require('./helpers');

// [ Server Setup ]
const app = express();
const PORT = 8080;
app.set('view engine', 'ejs');

// [ Middleware ]
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(cookieSession({
  userId: 'userId',
  keys: ['key1', 'key2']
}));

// [ GET Request Handlers ]
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/users.json', (req, res) => {
  res.json(usersDatabase);
});

app.get('/', (req, res) => {
  const userId = req.session.userId;
  const user = usersDatabase[userId];

  if (!user) {
    res.statusMessage = 'Client is not logged in.';
    return res.redirect('/login');
  }

  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  const userId = req.session.userId;
  const user = usersDatabase[userId];

  let urls = urlsForUser(userId, urlDatabase);

  const templateVars = { urls, user };

  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  if (!req.session.userId) {
    res.statusMessage = 'Client is not logged in.';
    return res.redirect('/login');
  }

  const userId = req.session.userId;
  const user = usersDatabase[userId];

  const templateVars = { user };

  res.render('urls_new', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  if (!urlDatabase[shortURL]) {
    res.statusCode = 404;
    res.statusMessage = `/u/${shortURL} was deleted or never existed in the first place.`;
    return res.send(`/u/${shortURL} was deleted or never existed in the first place.`);
  }

  const longURL = urlDatabase[shortURL].longURL;

  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.userId;
  const user = usersDatabase[userId];

  // Case: shortURL is invalid
  if (!urlDatabase[shortURL]) {
    res.statusCode = 404;
    res.statusMessage = `/urls/${shortURL} was deleted or never existed in the first place`;
    return res.send(`/urls/${shortURL} was deleted or never existed in the first place`);
  }

  // Case: shortURL is valid, but client is logged out
  if (!userId) {
    res.statusMessage = "Client is not logged in.";
    return res.redirect("/login");
  }

  // Case: client is logged in, but does not own endpoint
  if (urlDatabase[shortURL].userId !== userId) {
    res.statusCode = 404;
    res.statusMessage = `${shortURL} does not belong to ${usersDatabase[userId].email}`;
    return res.send(`${shortURL} does not belong to ${usersDatabase[userId].email}`);
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
  const user = usersDatabase[userId];

  // Case: client is not logged in
  if (!user) {
    res.statusMessage = 'Client is not logged in to access POST request to /urls.';
    return res.redirect(`/login`);
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  urlDatabase[shortURL] = { longURL, userId };

  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session.userId;
  const user = usersDatabase[userId];
  const shortURL = req.params.shortURL;

  // Case: shortURL does not exist
  if (!urlDatabase[shortURL]) {
    res.statusCode = 400;
    res.statusMessage = `/urls/${shortURL}/delete does not exist.`;
    return res.send(`/urls/${shortURL}/delete does not exist.`)
  }

  // Case: client is not logged in
  if (!user) {
    res.statusCode = 400;
    res.statusMessage = `Client is not logged in to access POST request to /urls/${shortURL}/delete.`;
    return res.send(`Client is not logged in to access POST request to /urls/${shortURL}/delete.`);
  }

  // Case: client is logged in, but does not own shortURL
  if (urlDatabase[shortURL].userId !== userId) {
    res.statusCode = 400;
    res.statusMessage = `Client is logged in, but does not own ${shortURL}.`;
    return res.send(`Client is logged in, but does not own ${shortURL}.`);
  }

  delete urlDatabase[shortURL];

  res.redirect(`/urls`);
});

app.post("/urls/:id", (req, res) => {
  const userId = req.session.userId;
  const user = usersDatabase[userId];

  const shortURL = req.params.id;

  // Case: shortURL does not exist
  if (!urlDatabase[shortURL]) {
    res.statusCode = 400;
    res.statusMessage = `/urls/${shortURL} does not exist.`;
    return res.send(`/urls/${shortURL} does not exist.`)
  }

  // Case: client is not logged in
  if (!user) {
    res.statusCode = 400;
    res.statusMessage = `Client is not logged in to access POST request to /urls/${shortURL}.`;
    return res.send(`Client is not logged in to access POST request to /urls/${shortURL}.`);
  }

  // Case: client is logged in, but does not own shortURL
  if (urlDatabase[shortURL].userId !== userId) {
    res.statusCode = 400;
    res.statusMessage = `Client is logged in, but does not own ${shortURL}.`;
    return res.send(`Client is logged in, but does not own ${shortURL}.`);
  }

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
    res.statusMessage = 'Email and password cannot be blank.';
    return res.send('Email and password cannot be blank.');
  }

  // Case: empty email
  if (!email) {
    res.statusCode = 400;
    res.statusMessage = 'Email cannot be blank.';
    return res.send('Email cannot be blank.');
  }

  // Case: empty password
  if (!password) {
    res.statusCode = 400;
    res.statusMessage = 'Password cannot be blank.';
    return res.send('Password cannot be blank.');
  }

  // Case: the given email has already been used to register
  if (!isNewEmail(email, usersDatabase)) {
    res.statusCode = 400;
    res.statusMessage = `${email} has already been used to register.`;
    return res.send(`${email} has already been used to register.`);
  }

  usersDatabase[id] = { id, email, hashedPassword };

  req.session.userId = id;

  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = getUserByEmail(email, usersDatabase);

  // Case: empty email and password
  if (!email && !password) {
    res.statusCode = 400;
    res.statusMessage = 'Email and password cannot be blank.';
    return res.send('Email and password cannot be blank.');
  }

  // Case: empty email
  if (!email) {
    res.statusCode = 400;
    res.statusMessage = 'Email cannot be blank.';
    return res.send('Email cannot be blank.');
  }

  // Case: empty password
  if (!password) {
    res.statusCode = 400;
    res.statusMessage = 'Password cannot be blank.';
    return res.send('Password cannot be blank.');
  }

  // Case: user with given email cannot be found
  if (!user) {
    res.statusCode = 403;
    res.statusMessage = `${email} is not associated with any user.`;
    return res.send(`${email} is not associated with any user.`);
  }

  // Case: valid email, but the given password is wrong
  if (!bcryptjs.compareSync(password, user.hashedPassword)) {
    res.statusCode = 403;
    res.statusMessage = `${password} is the wrong password for ${email}.`;
    return res.send(`${password} is the wrong password for ${email}.`);
  }

  req.session.userId = user.id;

  res.redirect(`/urls`);
});


// ---------------------------------------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});