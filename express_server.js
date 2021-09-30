// Dependencies
const cookieParser = require("cookie-parser");
const express = require("express");
const morgan = require("morgan");

const app = express();       // Start new Express application
const PORT = 8080;

app.set('view engine', 'ejs');

const users = {

};

const urlDatabase = {

};

// Generates a alphanumeric string of length 6
const generateRandomString = () => {
  // (Type 1) HTML code value bounds for uppercase letters
  const upperCaseStart = 65;
  const upperCaseEnd = 90;

  // (Type 2) HTML code value bounds for lowercase letters
  const lowerCaseStart = 97;
  const lowerCaseEnd = 122;

  // (Type 3) HTML code value bounds for the numbers 0 - 9
  const numberStart = 48;
  const numberEnd = 57;

  let randomString = '';

  for (let i = 0; i < 6; i++) {
    // Pick random type
    const min = 1;
    const max = 3;

    let type = Math.floor(Math.random() * (max - min + 1)) + min;

    // Random HTML code
    let asciiCode;

    // Pick random uppercase letter HTML code
    if (type === 1) {
      asciiCode = Math.floor(Math.random() * (upperCaseEnd - upperCaseStart + 1)) + upperCaseStart;
    }

    // Pick random lowercase letter HTML code
    if (type === 2) {
      asciiCode = Math.floor(Math.random() * (lowerCaseEnd - lowerCaseStart + 1)) + lowerCaseStart;
    }

    // Pick random number HTML code
    if (type === 3) {
      asciiCode = Math.floor(Math.random() * (numberEnd - numberStart + 1)) + numberStart;
    }

    randomString += String.fromCharCode(asciiCode);
  }

  return randomString;
};

// Checks if a given email has already been used to register
const isNewEmail = (email) => {
  for (const user in users) {
    if (users[user].email === email) {
      return false;
    }
  }

  return true;
};

// Finds a user given an email
const findUserByEmail = (email) => {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }

  return undefined;
};

// Returns every URL which belongs to the user with the given id
const urlsForUser = (id) => {
  let urls = {};

  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL]["userId"] === id) {
      urls[shortURL] = urlDatabase[shortURL].longURL;
    }
  }

  return urls;
};

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.static('public'));

// GET handlers
app.get("/urls/new", (req, res) => {
  // Case: not logged in
  if (!req.cookies["userId"]) {
    res.statusMessage = "Client is not logged in";
    return res.redirect(`/login`);
  }

  const userId = req.cookies["userId"];
  const user = users[userId];

  const templateVars = { user };

  res.render("urls_new", templateVars);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["userId"];
  const user = users[userId];

  let urls = urlsForUser(userId);

  const templateVars = { urls, user };

  res.render(`urls_index`, templateVars);
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
  const userId = req.cookies["userId"];
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
  const userId = req.cookies["userId"];

  if (userId) {
    return res.redirect("/urls");
  }

  res.render("registration");
});

app.get("/login", (req, res) => {
  const userId = req.cookies["userId"];

  if (userId) {
    return res.redirect("/urls");
  }

  res.render("login");
});

// POST handlers
app.post("/urls", (req, res) => {
  const userId = req.cookies["userId"];
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
  const userId = req.cookies["userId"];
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
  const userId = req.cookies["userId"];
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
  res.clearCookie("userId");

  res.redirect(`/urls`);
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

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
  if (!isNewEmail(email)) {
    res.statusCode = 400;
    return res.send(`${email} has already been used to register`);
  }

  users[id] = { id, email, password };

  res.cookie("userId", id);

  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = findUserByEmail(email);

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
  if (user.password !== password) {
    res.statusCode = 403;
    return res.send(`${password} is not the password for ${email}`);
  }

  res.cookie("userId", user.id);

  res.redirect(`/urls`);
});

// Listen to connections on the specified host and port
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});