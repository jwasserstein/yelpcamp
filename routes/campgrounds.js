const express    = require("express"),
	  router     = express.Router(),
	  Campground = require("../models/campground"),
	  Comment    = require("../models/comment"),
	  middleware = require("../middleware/index");

router.get("/", function(req, res){
	Campground.find({}, function(err, allCampgrounds){
		if(err){
			res.send("Error querying database: " + err);
		} else {
			res.render("campgrounds/index", {campgrounds: allCampgrounds});
		}
	});
	
});

router.post("/", middleware.isLoggedIn, function(req, res){
	let newCampground = req.body.campground;
	newCampground.author = {
			id: req.user._id,
			username: req.user.username
		};
	Campground.create(newCampground, function(err, campground){
		if(err){
			console.log(err);
		}
	});
	req.flash("success", "New campground created");
	res.redirect("/campgrounds");
});

router.get("/new", middleware.isLoggedIn, function(req, res){
	res.render("campgrounds/new");
});

router.get("/:id", function(req, res){
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err){
			req.flash("error", "Error loading campground");
			res.redirect("/campgrounds");
		} else {
			res.render("campgrounds/show", {campground: foundCampground});
		}
	});
});

router.get("/:id/edit", middleware.isLoggedIn, middleware.doesUserOwnCampground, function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			req.flash("error", "Error loading campground");
			res.redirect("/campgrounds");
		} else {
			res.render("campgrounds/edit", {campground: campground});
		}
	});
});

router.put("/:id", middleware.isLoggedIn, middleware.doesUserOwnCampground, function(req, res){
	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
		if(err){
			req.flash("error", "Error updating campground: " + err.message);
			res.redirect("/campgrounds");
		} else {
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

router.delete("/:id", middleware.isLoggedIn, middleware.doesUserOwnCampground, function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			res.send("Error finding campground: " + err);
		} else {
			Comment.deleteMany({_id: campground.comments}, function(err){
				if(err){
					res.send("Error deleting comments " + err);
				} else {
					Campground.findByIdAndDelete(req.params.id, function(err){
						if(err){
							res.send("Error deleting campground " + err);
						} else {
							res.redirect("/campgrounds");
						}
					});
				}
			});
		}
	});
});

module.exports = router;