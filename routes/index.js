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

router.get("/users/:id", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err || !foundUser){
			req.flash("error", "Couldn't find user");
			res.redirect("/campgrounds");
		} else {
			Campground.find({"author.id": req.params.id}, function(err, campgrounds){
				if(err){
					req.flash("error", "Couldn't find user's campgrounds");
					res.redirect("/campgrounds");
				} else {
					Comment.find({"author.id": req.params.id}, function(err, comments){
						if(err){
							req.flash("error", "Couldn't find user's comments");
							res.redirect("/campgrounds");
						} else {
							res.render("users/show", {
								foundUser: foundUser,
								campgrounds: campgrounds,
								comments: comments
							});
						}
					});
				}
			});
		}
	});
});

router.get("/users/:id/edit", function(req, res){
	res.render("users/edit");
});

router.put("/users/:id", function(req, res){
	User.findByIdAndUpdate(req.user._id, {
		"$set": {
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email
		}
	}, function(err, user){
		if(err){
			req.flash("error", "Error updating user profile");
			res.redirect("/users/" + req.user._id + "/edit");
		} else {
			req.flash("success", "Successfully updated user profile");
			res.redirect("/users/" + req.user._id);
		}
	});
});

module.exports = router;