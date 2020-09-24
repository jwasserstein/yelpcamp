const express    = require("express"),
	  router     = express.Router(),
	  User       = require("../models/user"),
	  Campground = require("../models/campground"),
	  Comment    = require("../models/comment");

router.get("/:id", async function(req, res){
	try {
		const foundUser = await User.findById(req.params.id);
		const campgrounds = await Campground.find({"author.id": req.params.id});
		const comments = await Comment.find({"author.id": req.params.id});
		res.render("users/show", {
			foundUser: foundUser,
			campgrounds: campgrounds,
			comments: comments
		});
	} catch (err) {
		req.flash("error", "Error loading user profile");
		return res.redirect("/campgrounds");
	}
});

router.get("/:id/edit", function(req, res){
	res.render("users/edit");
});

router.put("/:id", async function(req, res){
	try {
		const user = await User.findByIdAndUpdate(req.user._id, {
			"$set": {
				firstName: req.body.firstName,
				lastName: req.body.lastName,
				email: req.body.email
			}
		});
		req.flash("success", "Successfully updated user profile");
		return res.redirect("/users/" + req.user._id);
	} catch (err) {
		req.flash("error", "Error updating user profile");
		return res.redirect("/users/" + req.user._id + "/edit");
	}
});

module.exports = router;