const express    = require("express"),
	  router     = express.Router(),
	  Campground = require("../models/campground"),
	  Comment    = require("../models/comment"),
	  middleware = require("../middleware/index");

router.get("/", async function(req, res){
	try {
		const allCampgrounds = await Campground.find({});
		res.render("campgrounds/index", {campgrounds: allCampgrounds});
	} catch (err) {
		res.send("Error querying database: " + err);
	}
});

router.post("/", middleware.isLoggedIn, async function(req, res){
	let newCampground = req.body.campground;
	newCampground.author = {
			id: req.user._id,
			username: req.user.username
		};
	try {
		await Campground.create(newCampground);
		req.flash("success", "New campground created");
	} catch (err) {
		req.flash("error", "Error creating new campground");
	}
	res.redirect("/campgrounds");
});

router.get("/new", middleware.isLoggedIn, function(req, res){
	res.render("campgrounds/new");
});

router.get("/:id", async function(req, res){
	try {
		const foundCampground = await Campground.findById(req.params.id).populate("comments");
		res.render("campgrounds/show", {campground: foundCampground});
	} catch (err) {
		req.flash("error", "Error loading campground");
		res.redirect("/campgrounds");
	}
});

router.get("/:id/edit", middleware.isLoggedIn, middleware.doesUserOwnCampground, async function(req, res){
	try {
		const campground = await Campground.findById(req.params.id);
		res.render("campgrounds/edit", {campground: campground});
	} catch (err) {
		req.flash("error", "Error loading campground");
		res.redirect("/campgrounds");
	}
});

router.put("/:id", middleware.isLoggedIn, middleware.doesUserOwnCampground, async function(req, res){
	try {
		const campground = await Campground.findByIdAndUpdate(req.params.id, req.body.campground);
		res.redirect("/campgrounds/" + req.params.id);
	} catch (err) {
		req.flash("error", "Error updating campground: " + err.message);
		res.redirect("/campgrounds");
	}
});

router.delete("/:id", middleware.isLoggedIn, middleware.doesUserOwnCampground, async function(req, res){
	try {
		const campground = await Campground.findById(req.params.id);
		await Comment.deleteMany({_id: campground.comments});
		await Campground.findByIdAndDelete(req.params.id);
		req.flash("success", "Successfully deleted campground");
	} catch (err) {
		req.flash("error", "Error deleting campground: " + err.message);
	}
	res.redirect("/campgrounds");
});

module.exports = router;