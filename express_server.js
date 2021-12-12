const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const PORT = 8080; // default port 8080

// set the view engine to ejs
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['Nivedha'],
}));

// 
const { generateRandomString, emailHasUser, userIdFromEmail, urlsForUser, cookieHasUser, getUserByEmail } = require("./helpers");

const urlDatabase = {
  "b6UTxQ": {
      longURL: "https://www.tsn.ca",
      userID: "aJ48lW"
  },
  "i3BoGr": {
      longURL: "https://www.google.ca",
      userID: "aJ48lW"
  }
};

//Global users object to store and access the users in the app
let users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
}


// Add a '/' route sending out Hello! response
app.get("/", (req, res) => {
  if (cookieHasUser(req.session.user_id, users)) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
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
    urls: urlsForUser(req.session.user_id, urlDatabase),//passing the current user_id value to the db
    user: users[req.session.user_id], // pass the entire user object to the template instead of passing the username
  };
  res.render("urls_index", templateVars);
});

//Route to render the urls_new template
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id], // pass the entire user object to the template instead of passing the username
  };
  if (!cookieHasUser(req.session.user_id, users)) {
    res.redirect('/login');
  }
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id,
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(401).send("You must be logged in to a valid account to create short URLs.");
  }
});

//Route to render the urls_show template
app.get('/urls/:shortURL', (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    urlUserID: urlDatabase[req.params.shortURL].userID, //current userID
    // username: req.cookies["username"], // Pass username value to all the templates that has _header.ejs file included
    user: users[req.session.user_id], // pass the entire user object to the template instead of passing the username
  };
  res.render('urls_show', templateVars);
});

//Route to redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if (shortURL) {
    //get the long url for the short url s
    const longURL = urlDatabase[req.params.shortURL].longURL;
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
  const userID = req.session.user_id;
  const userUrls = urlsForUser(userID, urlDatabase);
  if (Object.keys(userUrls).includes(req.params.shortURL)) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.send(401);
  }
});

//POST route to update a URL resource
app.post("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const userUrls = urlsForUser(userID, urlDatabase);
  if (Object.keys(userUrls).includes(req.params.id)) {
    const shortURL = req.params.id;
    urlDatabase[shortURL].longURL = req.body.newURL;
    res.redirect('/urls');
  } else {
    res.send(401);
  }
});

// GET the login page using GET /login endpoint
app.get("/login", (req, res) => {
  if (cookieHasUser(req.session.user_id, users)) {
    res.redirect("/urls");
  } else {
    let templateVars = {
    user: users[req.session.user_id],
    } // pass the entire user object to the template instead of passing the username
    res.render('login', templateVars);
  }
});

//POST route to login, sets a cookie with submitted username
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!emailHasUser(email, users)) {
    res.status(403).send("There is no account associated with this email address");
  } else {
    const userID = userIdFromEmail(email, users);
    console.log(password);
    console.log(users[userID].password);
    if (!bcrypt.compareSync(password, users[userID].password)) {
      res.status(403).send("The password you entered does not match the one associated with the provided email address");
    } else {
      req.session.user_id = userID;
      res.redirect("/urls");
    }
  }
});
  

//POST route to clear already set username cookie while logging out
app.post("/logout", (req, res) => {
  req.session = null; //clears the user_id cookie
  res.redirect('/urls');
});

//GET the registeration page using GET /register endpoint
app.get("/register", (req, res) => {
  if (cookieHasUser(req.session.user_id, users)) {
    res.redirect("/urls");
  } else {
    let templateVars = {
    user: users[req.session.user_id], // pass the entire user object to the template instead of passing the username
   };
   res.render('register', templateVars);
  }
});

//POST route to handle the user registration
app.post("/register", (req, res) => {
  const newUserID = generateRandomString();
  const submittedEmail = req.body.email;
  const submittedPassword = req.body.password;
  //use bcryptjs to hash when hashing passwords
  const hashedPassword = bcrypt.hashSync(submittedPassword, 10);

  if (!submittedEmail || !submittedPassword) {
    res.send(400, "Please include both a valid email and password");
  } else if (emailHasUser(submittedEmail, users)) {
    res.send(400, "An account already exists for this email address");
  } else {
    //add a new user object to the global users object
    users[newUserID] = {
      id: newUserID,
      email: submittedEmail,
      password: submittedPassword
    };

    console.log(users);
    //set a cookie
    req.session.user_id = newUserID;
    //redirect to urls page
    res.redirect('/urls');
  }

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});