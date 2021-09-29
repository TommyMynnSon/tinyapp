const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

const users = {

};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "yfjptz64": "https://www.tsn.ca"
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

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// GET handlers
app.get("/urls/new", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];

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
  const user_id = req.cookies["user_id"];
  const user = users[user_id];

  const templateVars = { urls: urlDatabase, user };

  res.render(`urls_index`, templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];

  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const user_id = req.cookies["user_id"];
  const user = users[user_id];

  const templateVars = { shortURL, longURL, user };

  res.render(`urls_show`, templateVars);
});

app.get("/register", (req, res) => {
  res.render("registration");
});

// POST handlers
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  urlDatabase[shortURL] = longURL;

  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;

  delete urlDatabase[shortURL];

  res.redirect(`/urls`);
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const newLongURL = req.body.newLongURL;

  urlDatabase[shortURL] = newLongURL;

  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  const username = req.body.username;

  res.cookie("username", username);

  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");

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

  console.log("express_server.js : 204");

  users[id] = { id, email, password };

  res.cookie("user_id", id);

  res.redirect(`/urls`);
});

// Listen to connections on the specified host and port
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});