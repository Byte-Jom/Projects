require('dotenv').config()
const express = require("express"),
	ejs = require("ejs"),
	mongoose = require("mongoose"),
	encrypt = require("mongoose-encryption"), // used for encryption
  md5 = require("md5"), // used for hashing. this is too weak accdg to a user. min should be SHA512
  // look at bcrypt docs in npm to see functions
	bcrypt = require("bcrypt"), 
	saltRounds = 10, // used to add salt to hashes. stronger than md5
  /* 
    used to utilize cookies and such
    just check docs for more info
    May look into these sites for a better understanding:
      https://machinesaredigging.com/2013/10/29/how-does-a-web-session-work/
      https://mherman.org/blog/local-authentication-with-passport-and-express-4/
			https://www.sitepoint.com/local-authentication-using-passport-node-js/
			below is the greatest resource out of the ones listed here
      https://levelup.gitconnected.com/everything-you-need-to-know-about-the-passport-local-passport-js-strategy-633bbab6195

  */
	session = require("express-session"),
	passport = require("passport"),
	passportLocalMongoose = require("passport-local-mongoose"),

	/*
		Why OAuth?
			- lets other companies handle the security authentication sht
			- ex. Log In with Facebook
			1. Granular Access Levels
				- can specify which elements of their profile will be requested
				- ex. just request for profile picture and email from Facebook
			2. Read(+ Write) Access
				- ex. just retrieve email/friends or ask access for writing posts in FB (e.g. WordPress)
			3. Revoke Access
				- ex. the FB user can deauthorize access granted to your website in their FB account
		Steps
			1. Set Up Your App
				- tell the 3rd party about our web application
				- set our app in their developer console (will get an app/client id in return)
				- our website is the client that asks FB to authenticate our user
			2. Redirect to Authenticate
				- ex. if the user clicked "Log In with Facebook", our site will redirect to their site
			3. User Logs In
				- user login using FB credentials
			4. User Grants Permissions
				- ex. "Blah blah will receive the following info: your profile picture and email address"
			5. Receive Autorization Code
				- allows us to check if they successfully logged in FB
				- autheticated them and logged them in our site
				- analogy: a one time use ticket
			6. Exchange AuthCode for Access Token
				- the access token received will be saved in the database since this can be used to request information (e.g. friends list) subsequently
				- analogy: a year pass
	*/
	GoogleStrategy = require("passport-google-oauth20").Strategy,
	findOrCreate = require("mongoose-findorcreate");

const	app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// this should be places at this exact spot
// sets up the passport
app.use(session({
  secret: 'fpD2aw-V_9jy3oNN91FAVk3MiKSjTvi95wsSBR3gbV8CPWMdyYErvF960k6BvTP27uOlkFYttKVf5I8LHcEkfQ',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
});

// for the depracation warning
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
	email: String,
	password: String,
	googleId: String // used in OAuth
});

//should be places between the Schema and model for passport
userSchema.plugin(passportLocalMongoose);
// for the findOrCreate npm
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

// palces after model for passport
passport.use(User.createStrategy());
 
// only works for local authentication
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// works for every authentication
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// for OAuth Google
passport.use(
	new GoogleStrategy(
		{
			// from Google APIs Project Setup
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: "http://localhost:3000/auth/google/techno",
			userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo", // to not use the Google+ API
		},
		function (accessToken, refreshToken, profile, cb) {
			// uses the function in the findOrCreate npm
			User.findOrCreate({ googleId: profile.id }, (err, user) => {
				return cb(err, user);
			});
		}
	)
);

const encKey = process.env.ENC_KEY, //ENC_KEY is stored in the .env file in the same folder
  sigKey = process.env.SIG_KEY; //SIG_KEY is stored in the .env file in the same folder

// used to plugin an encrypt into the Schema. Based on the npm mongoose encrypt docs
// for encrypt
userSchema.plugin(encrypt, {
	encryptionKey: encKey,
	signingKey: sigKey,
	encryptedFields: ["password"], // used to determine which field will be encrypted.
});

app.route("/").get((req, res) => {
	res.render("home");
});

// using md5 without salt

app
	.route("/register")
	.get((req, res) => {
		res.render("register");
	})
	.post((req, res) => {
		const newUser = new User({
			email: req.body.username,
			password: md5(req.body.password), //md5 is used for hashing
		});
		newUser.save((err) => {
			if (err) {
				console.log(err);
			} else {
				res.render("secrets");
			}
		});
	});

app
	.route("/login")
	.get((req, res) => {
		res.render("login");
	})
	.post((req, res) => {
		User.findOne({ email: req.body.username }, (err, user) => {
			if (err) {
				res.send(err);
			} else if (!user) {
				res.send("That account does not exist.");
			} else {
				if (user.password === md5(req.body.password)) { //hash the input password to match the hashed password in register
					res.render("secrets");
				} else {
					res.send("Incorrect password.");
				}
			}
		});
	});

// using bcrypt with salt

app
	.route("/register")
	.get((req, res) => {
		res.render("register");
	})
	.post((req, res) => {
		bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
			const newUser = new User({
				email: req.body.username,
				password: hash
			});
			newUser.save((err) => {
				if (err) {
					console.log(err);
				} else {
					res.render("secrets");
				}
			});
		});
	});

app
	.route("/login")
	.get((req, res) => {
		res.render("login");
	})
	.post((req, res) => {
		User.findOne({ email: req.body.username }, (err, user) => {
			if (err) {
				res.send(err);
			} else if (!user) {
				res.send("That account does not exist.");
			} else {
				bcrypt.compare(req.body.password, user.password, function(err, result) {
					if (result) {
						res.render("secrets");
					} else {
						res.send("Incorrect password.");
					}
				});
			}
		});
	});

// Using passport

app
	.route("/register")
	.get((req, res) => {
		res.render("register");
	})
	.post((req, res) => {
		User.register({username: req.body.username, active: false}, req.body.password, (err, user) => {
			if (err) {
				console.log(err);
				res.redirect("/register");
			} else {
				passport.authenticate('local')(req, res, () => {
					res.redirect("/secrets");
				});
			}
		});
	});

app
	.route("/login")
	.get((req, res) => {
		res.render("login");
	})
	.post(passport.authenticate('local'), (req, res) => {
		res.redirect("/secrets");
	});

app.route("/secrets")
	.get((req, res) => {
		if (req.isAuthenticated()) {
			res.render("secrets");
		} else {
			res.redirect("/login");
		}
	});

app.route("/logout")
	.get((req, res) => {
		req.logout();
  	res.redirect('/');
	});

// Using Google OAuth. based on passport strategies docs
app.get(
	"/auth/google",
	passport.authenticate("google", { scope: ["profile"] })
);

app.get(
	"/auth/google/techno",
	passport.authenticate("google", { failureRedirect: "/login" }),
	function (req, res) {
		res.redirect("/secrets");
	}
);

app.listen(3000, () => {
	console.log("Server is running in port 3000!");
});