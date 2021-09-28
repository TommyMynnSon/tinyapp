const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

const generateRandomString = () => {
  // (Type 1) ASCII value bounds for uppercase letters
  const upperCaseStart = 65;
  const upperCaseEnd = 90;

  // (Type 2) ASCII value bounds for lowercase letters
  const lowerCaseStart = 97;
  const lowerCaseEnd = 122;

  // (Type 3) ASCII value bounds for the numbers 0 - 9
  const numberStart = 48;
  const numberEnd = 57;

  let randomString = '';

  for (let i = 0; i < 6; i++) {
    // Pick random type
    const min = 1;
    const max = 3

    let type = Math.floor(Math.random() * (max - min + 1)) + min;

    let asciiCode;

    // Pick random uppercase letter ASCII code 
    if (type === 1) {
      asciiCode = Math.floor(Math.random() * (upperCaseEnd - upperCaseStart + 1)) + upperCaseStart
    }

    // Pick random lowercase letter ASCII code
    if (type === 2) {
      asciiCode = Math.floor(Math.random() * (lowerCaseEnd - lowerCaseStart + 1)) + lowerCaseStart;
    }

    // Pick random number ASCII code
    if (type === 3) {
      asciiCode = Math.floor(Math.random() * (numberEnd - numberStart + 1)) + numberStart;
    }

    randomString += String.fromCharCode(asciiCode);
  }

  console.log(randomString);
  return randomString;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "yfjptz64": "https://www.tsn.ca"
};

// MIDDLEWARE
app.use(bodyParser.urlencoded({ extended: true }));

// GET
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
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
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];

  const templateVars = { shortURL, longURL };
  res.render("urls_show", templateVars);
});

// POST
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

// CONNECT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});