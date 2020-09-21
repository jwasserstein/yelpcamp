const express    = require("express"),
	  router     = express.Router(),
	  User       = require("../models/user"),
	  Campground = require("../models/campground"),
	  Comment    = require("../models/comment");

router.get("/:id", function(req, res){
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

router.get("/:id/edit", function(req, res){
	res.render("users/edit");
});

router.put("/:id", function(req, res){
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