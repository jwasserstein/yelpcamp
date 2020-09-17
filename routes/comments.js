const express    = require("express"),
	  router     = express.Router({mergeParams: true}),
	  Campground = require("../models/campground"),
	  Comment    = require("../models/comment"),
	  middleware = require("../middleware");  //Requiring a directory is the same as requiring the index.js file in that directory

router.get("/new", middleware.isLoggedIn, function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			res.send("Couldn't find campground in database: " + err);
		} else {
			res.render("comments/new", {campground: campground});
		}
	});
});

router.post("/", middleware.isLoggedIn, function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			res.send("Couldn't find campground in database: " + err);
		} else {
			Comment.create({
				text: req.body.text,
				author: {
					id: req.user._id,
					username: req.user.username
				}
			}, function(err, comment){
				campground.comments.push(comment);
				campground.save();
				res.redirect("/campgrounds/" + req.params.id);
			});
		}
	});
});

router.get("/:commentId/edit", middleware.isLoggedIn, middleware.doesUserOwnComment, function(req, res){
	Comment.findById(req.params.commentId, function(err, comment){
		if(err){
			res.send("Error finding comment: " + err);
		} else {
			res.render("comments/edit", {campgroundId: req.params.id, comment: comment});
		}
	});
});

router.put("/:commentId", middleware.isLoggedIn, middleware.doesUserOwnComment, function(req, res){
	req.body.text = req.sanitize(req.body.text);
	Comment.findByIdAndUpdate(req.params.commentId, req.body, function(err, comment){
		if(err){
			res.send("Error updating comment: " + err);
		} else {
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

router.delete("/:commentId", middleware.isLoggedIn, middleware.doesUserOwnComment, function(req, res){
	Comment.findByIdAndDelete(req.params.commentId, function(err){
		if(err){
			res.send("Error deleting comment: " + err);
		} else {
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

module.exports = router;