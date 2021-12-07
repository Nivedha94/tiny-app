const express = require("express");
const app = express();
const PORT = 3000; // default port 3000

// set the view engine to ejs
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Add a '/' route sending out Hello! response
app.get("/", (req, res) => {
  res.end("Hello!");
});


// Add a '/urls.json' to display the urlDatabase in JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//HTML code rendered to the client browser
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//Route to render the urls_index template
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//Route to render the urls_show template
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render('urls_show', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});