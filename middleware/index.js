const Campground = require("../models/campground"),
	  Comment    = require("../models/comment");

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		next();
	} else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("/login");
	}
}

function doesUserOwnCampground(req, res, next){
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			res.send("Error finding campground in database: " + err);
		} else {
			if(req.user._id.equals(campground.author.id)){
				next();
			} else {
				req.flash("error", "You're not authorized to do that");
				res.redirect("back");
			}
		}
	});
}

function doesUserOwnComment(req, res, next){
	Comment.findById(req.params.commentId, function(err, comment){
		if(err){
			res.send("Error finding comment: " + err);
		} else {
			if(comment.author.id.equals(req.user._id)){
				next();
			} else {
				req.flash("error", "You're not authorized to do that");
				res.send("You're not authorized to do that");
			}
		}
	});
}

const middlewareObj = {
	isLoggedIn: isLoggedIn,
	doesUserOwnCampground: doesUserOwnCampground,
	doesUserOwnComment: doesUserOwnComment
};

module.exports = middlewareObj;