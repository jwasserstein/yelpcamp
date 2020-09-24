const express    = require("express"),
	  router     = express.Router({mergeParams: true}),
	  Campground = require("../models/campground"),
	  Comment    = require("../models/comment"),
	  middleware = require("../middleware");  //Requiring a directory is the same as requiring the index.js file in that directory

router.get("/new", middleware.isLoggedIn, async function(req, res){
	try {
		const campground = await Campground.findById(req.params.id);
		res.render("comments/new", {campground: campground});
	} catch (err) {
		req.flash("error", "Couldn't find campground in database");
		res.redirect("/campgrounds/" + req.params.id);
	}
});

router.post("/", middleware.isLoggedIn, async function(req, res){
	try {
		let campground = await Campground.findById(req.params.id);
		const comment = await Comment.create({
			text: req.body.text,
			author: {
				id: req.user._id,
				username: req.user.username
			}
		});
		campground.comments.push(comment);
		campground.save();
		res.redirect("/campgrounds/" + req.params.id);
	} catch (err) {
		req.flash("error", "Error adding comment: " + err.message);
		res.redirect("/campgrounds/");
	}
});

router.get("/:commentId/edit", middleware.isLoggedIn, middleware.doesUserOwnComment, async function(req, res){
	try {
		const comment = await Comment.findById(req.params.commentId);
		res.render("comments/edit", {campgroundId: req.params.id, comment: comment});
	} catch (err) {
		req.flash("error", "Error updating comment");
		res.redirect("/campground");
	}
});

router.put("/:commentId", middleware.isLoggedIn, middleware.doesUserOwnComment, async function(req, res){
	req.body.text = req.sanitize(req.body.text);
	
	try {
		const comment = await Comment.findByIdAndUpdate(req.params.commentId, req.body);
		res.redirect("/campgrounds/" + req.params.id);
	} catch (err) {
		req.flash("error", "Error updating comment: " + err.message);
		res.redirect("/campground");
	}
});

router.delete("/:commentId", middleware.isLoggedIn, middleware.doesUserOwnComment, async function(req, res){
	try {
		await Comment.findByIdAndDelete(req.params.commentId);
		res.redirect("/campgrounds/" + req.params.id);
	} catch (err){
		req.flash("error", "Error deleting comment: " + err.message);
		res.redirect("/campgrounds");
	}
});

module.exports = router;