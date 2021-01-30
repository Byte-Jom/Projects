require("dotenv").config();
const express = require("express"),
	ejs = require("ejs"),
	mongoose = require("mongoose"),
	session = require("express-session"),
	passport = require("passport"),
	passportLocalMongoose = require("passport-local-mongoose"),
	GoogleStrategy = require("passport-google-oauth20").Strategy,
	findOrCreate = require("mongoose-findorcreate");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
	session({
		secret:
			"fpD2aw-V_9jy3oNN91FAVk3MiKSjTvi95wsSBR3gbV8CPWMdyYErvF960k6BvTP27uOlkFYttKVf5I8LHcEkfQ",
		resave: false,
		saveUninitialized: false,
	})
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
});

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
	email: String,
	password: String,
	googleId: String,
	secrets: [String],
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: "http://localhost:3000/auth/google/techno",
			userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
		},
		function (accessToken, refreshToken, profile, cb) {
			User.findOrCreate({ googleId: profile.id }, (err, user) => {
				return cb(err, user);
			});
		}
	)
);

app.route("/").get((req, res) => {
	res.render("home");
});

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

app
	.route("/register")
	.get((req, res) => {
		res.render("register");
	})
	.post((req, res) => {
		User.register(
			{ username: req.body.username, active: false },
			req.body.password,
			(err, user) => {
				if (err) {
					console.log(err);
					res.redirect("/register");
				} else {
					passport.authenticate("local")(req, res, () => {
						res.redirect("/secrets");
					});
				}
			}
		);
	});

app
	.route("/login")
	.get((req, res) => {
		res.render("login");
	})
	.post(passport.authenticate("local"), (req, res) => {
		res.redirect("/secrets");
	});

app.route("/secrets").get((req, res) => {
	if (req.isAuthenticated()) {
		User.find({"secrets":{$ne:null}}, (err, users) => {
			if (err) {
				console.log(err);
			} else {
				res.render("secrets", { users, users });
			}
		});
	} else {
		res.redirect("/login");
	}
});

app.route("/logout").get((req, res) => {
	req.logout();
	res.redirect("/");
});

app
	.route("/submit")
	.get((req, res) => {
		if (req.isAuthenticated()) {
			res.render("submit");
		} else {
			res.redirect("/login");
		}
	})
	.post((req, res) => {
		User.findById(req.user.id, (err, user) => {
			if (err) {
				console.log(err);
			} else {
				user.secrets.push(req.body.secret);
				user.save(() => {
					res.redirect("/secrets");
				});
			}
		});
	});

app.listen(3000, () => {
	console.log("Server is running in port 3000!");
});
