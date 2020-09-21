const express    = require("express"),
	  router     = express.Router(),
	  User       = require("../models/user"),
	  Campground = require("../models/campground"),
	  Comment    = require("../models/comment"),
	  passport   = require("passport");

router.get("/", function(req, res){
	res.render("landing");
});

router.get("/register", function(req, res){
	res.render("register");
});

router.post("/register", function(req, res){
	User.register(new User({
		username: req.body.username,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email
	}), req.body.password, function(err, user){
		if(err){
			console.log("error creating user: " + err);
			res.redirect("/register");
		} else {
			passport.authenticate("local")(req, res, function(){
				req.flash("success", "New account created");
				res.redirect("/campgrounds");
			});
		}
	});
});

router.get("/login", function(req, res){
	res.render("login");
});

router.post("/login", passport.authenticate("local", {
	successRedirect: "/campgrounds",
	failureRedirect: "/login"
}), function(req, res){});

router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "You've been logged out.");
	res.redirect("/campgrounds");
});

module.exports = router;