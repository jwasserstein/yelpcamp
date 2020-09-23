const express    = require("express"),
	  router     = express.Router(),
	  User       = require("../models/user"),
	  Campground = require("../models/campground"),
	  Comment    = require("../models/comment"),
	  passport   = require("passport"),
	  asyncPack  = require("async"),
	  nodeMailer = require("nodemailer"),
	  crypto     = require("crypto"),
	  middleware = require("../middleware/index.js");

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

router.get("/forgot", function(req, res){
	res.render("forgot");
});

router.post("/forgot", function(req, res){
	asyncPack.waterfall([
		function(done){
			crypto.randomBytes(20, function(err, buf){
				done(err, buf.toString('hex'));
			});
		},
		function(token, done){
			User.findOne({username: req.body.username}, function(err, user){
				if(err || !user){
					req.flash("error", "Couldn't find that user");
					return res.redirect("/forgot");
				}
				if(!user.email){
					req.flash("error", "That user doesn't have an email, can't reset password");
					return res.redirect("/forgot");
				}
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000; //3600000 ms = 1 hour

				user.save(function(err){
					done(err, token, user);
				});
			});
		},
		function(token, user, done){
			const smtpTransport = nodeMailer.createTransport({
				service: "Gmail",
				auth: {
					user: process.env.GMAILUSERNAME,
					pass: process.env.GMAILPASSWORD
				}
			});
			
			const mailOptions = {
				to: user.email,
				from: "yelpcamp1993@gmail.com",
				subject: "YelpCamp Password Reset",
				text: "Someone requested the password to your account be reset.  If you submitted this request " + 
					  "please click the link below.  If you did not submit this request, please ignore this email " + 
					  "and your password will remain unchanged.\n\n" + 
					  "https://" + req.headers.host + "/forgot/" + token
			};
			
			smtpTransport.sendMail(mailOptions, function(err){
				if(err){
					req.flash("error", "Error sending password reset email");
					return res.redirect("/campgrounds");
				}
				req.flash("success", "An email has been sent with instructions to reset your password");
				done(err, "done");
			});
		}
	], function(err){
		if(err){
			console.error(err);
			req.flash("error", "Error processing password reset request");
			res.redirect("/campgrounds");
		} else {
			res.redirect("/campgrounds");
		}
	});
});

router.get("/forgot/:token", function(req, res){
	User.findOne({resetPasswordToken: req.params.token}, function(err, user){
		if(err || !user || (user.resetPasswordExpires < Date.now())){
			req.flash("error", "That link is either invalid or expired");
			res.redirect("/campgrounds");
		} else {
			res.render("reset", {action: "/forgot/" + req.params.token});
		}
	});
});

router.post("/forgot/:token", function(req, res){
	asyncPack.waterfall([
		function(done){
			User.findOne({resetPasswordToken: req.params.token}, function(err, user){
				if(err || !user || (user.resetPasswordExpires < Date.now())){
					req.flash("error", "That link is either invalid or expired");
					return res.redirect("/campgrounds");
				}
				
				if(req.body.password1 !== req.body.password2){
					req.flash("error", "Your passwords must be the same");
					return res.redirect("/reset/" + req.params.token);
				}
				
				user.setPassword(req.body.password1, function(err){
					user.resetPasswordToken = undefined;
					user.resetPasswordExpires = undefined;
					
					user.save(function(err){
						if(err){
							req.flash("error", "Error saving new password");
							return res.redirect("/campgrounds");
						}
						req.logIn(user, function(err){
							if(err){
								req.flash("error", "Error logging you in");
								console.log(err);
								return res.redirect("/campgrounds");
							}
							done(err, user);
						});
					});
				});
			});
		},
		function(user, done){
			const smtpTransport = nodeMailer.createTransport({
				service: "Gmail",
				auth: {
					user: process.env.GMAILUSERNAME,
					pass: process.env.GMAILPASSWORD
				}
			});
			
			const mailOptions = {
				to: user.email,
				from: "yelpcamp1993@gmail.com",
				subject: "YelpCamp Password Reset Confirmation",
				text: "The password to your account " + user.username + " on yelpcamp was reset."
			}
			
			smtpTransport.sendMail(mailOptions, function(err){
				if(err){
					req.flash("error", "Error sending confirmation email");
					return res.redirect("/campgrounds");
				}
				done(err, "done");
			});
		}
	], function(err){
		if(!err){
			req.flash("success", "Password reset successfully");
		} else {
			req.flash("error", "Error changing password");
		}
		res.redirect("/campgrounds");
	});
});

router.get("/reset", middleware.isLoggedIn, function(req, res){
	res.render("reset", {action: "/reset"});
});

router.post("/reset", middleware.isLoggedIn, function(req, res){
	if(req.body.password1 !== req.body.password2){
		req.flash("error", "Your passwords must match");
		res.redirect("/reset", {action: "/reset"});
	}
	
	User.findById(req.user._id, function(err, user){
		if(err){
			req.flash("error", "Error finding user in database for password change");
			res.redirect("/reset", {action: "/reset"});
		}
		
		user.setPassword(req.body.password1, function(err){
			if(err){
				req.flash("error", "Error changing password in database");
				res.redirect("/reset", {action: "/reset"});
			}
			user.save(function(err){
				if(err){
					req.flash("error", "Error changing password in database");
					res.redirect("/reset", {action: "/reset"});
				}
				req.flash("success", "Password changed successfully");
				res.redirect("/campgrounds");
			});
		});
	});
});

module.exports = router;