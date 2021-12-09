const express = require("express");
const app = express();
const PORT = 3000; // default port 3000

// set the view engine to ejs
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

//email validation for registration route
const emailAlreadyExists = function(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return true
    }
  } return false;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Global users object to store and access the users in the app
let users = { 
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
}

//Generate a random shortURL
function generateRandomString() {
  return Math.random().toString(36).slice(6);
}

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
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"], // Pass username value to all the templates that has _header.ejs file included
  };
  res.render("urls_index", templateVars);
});

//Route to render the urls_new template
app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"], // Pass username value to all the templates that has _header.ejs file included
  };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.statusCode = 200;
  res.redirect(`/urls/${shortURL}`);   //redirect the user to a new page
});

//Route to render the urls_show template
app.get('/urls/:shortURL', (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"], // Pass username value to all the templates that has _header.ejs file included
  };
  res.render('urls_show', templateVars);
});

//Route to redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if (shortURL) {
    //get the long url for the short url s
    const longURL = urlDatabase[shortURL];
    if (longURL) {
      res.redirect(longURL);
    } else {
      res
        .status(404)
        .send({ message: "long url not found for the given short url" });
    }
  }
});

//route to remove a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

//POST route to update a URL resource
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect('/urls');
});

//POST route to login, sets a cookie with submitted username
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

//POST route to clear already set username cookie while logging out
app.post("/logout", (req, res) => {
  res.clearCookie('username'); //clears the username cookie
  res.redirect('/urls');
});

//GET the registeration page using GET /register endpoint
app.get("/register", (req, res) => {
  let templateVars = {
    username: req.cookies["username"], // Pass username value to all the templates that has _header.ejs file included
  };
  res.render('register', templateVars);
});

//POST route to handle the user registration
app.post("/register", (req, res) => {
  
  const submittedEmail = req.body.email;
  const submittedPassword = req.body.password;

  if (!submittedEmail || !submittedPassword) {
    res.send(400, "Please include both a valid email and password");
  } else if (emailAlreadyExists(submittedEmail)) {
    res.send(400, "An account already exists for this email address");
  } else {
    let newUserID = generateRandomString();
    //add a new user object to the global users object
    users[newUserID] = {
      id: newUserID,
      email: submittedEmail,
      password: submittedPassword
    };

    //set a cookie
    res.cookie('user_id', newUserID);

    //redirect to urls page
    res.redirect = ('/urls');
  }

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});