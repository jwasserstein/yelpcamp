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

router.post("/register", async function(req, res){
	try {
		const user = await User.register(new User({
			username: req.body.username,
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email
		}), req.body.password);
		passport.authenticate("local")(req, res, function(){
			req.flash("success", "New account created");
			res.redirect("/campgrounds");
		});
	} catch (err) {
		req.flash("error", "Error creating user");
		res.redirect("/register");
	}
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

router.post("/forgot", async function(req, res){
	try {
		let buf = await crypto.randomBytes(20);
		buf = buf.toString('hex');

		const user = await User.findOne({username: req.body.username});
		if(!user){
			req.flash("error", "Couldn't find that user");
			res.redirect("/forgot");
		}
		if(!user.email){
			req.flash("error", "That user doesn't have an email, can't reset password");
			res.redirect("/forgot");
		}

		user.resetPasswordToken = buf;
		user.resetPasswordExpires = Date.now() + 3600000; // 3600000 ms = 1 hour
		await user.save();

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
				  "https://" + req.headers.host + "/forgot/" + buf
		};

		await smtpTransport.sendMail(mailOptions);
		req.flash("success", "An email has been sent with instructions to reset your password");
		return res.redirect("/campgrounds");
	} catch (err) {
		req.flash("error", "Error sending reset password email: " + err.message);
		return res.redirect("/forgot");
	}
});

router.get("/forgot/:token", async function(req, res){
	try {
		const user = await User.findOne({resetPasswordToken: req.params.token});
		if(!user || (user.resetPasswordExpires < Date.now())){
			req.flash("error", "That link is either invalid or expired");
			return res.redirect("/forgot");
		}
		res.render("reset", {action: "/forgot/" + req.params.token});
	} catch (err) {
		req.flash("error", "Error loading password reset form");
		res.redirect("/forgot");
	}
});

router.post("/forgot/:token", async function(req, res){
	try{
		const user = await User.findOne({resetPasswordToken: req.params.token});
		if(!user || (user.resetPasswordExpires < Date.now())){
			req.flash("error", "That link is either invalid or expired");
			return res.redirect("/campgrounds");
		}

		if(req.body.password1 !== req.body.password2){
			req.flash("error", "Your passwords must be the same");
			return res.redirect("/reset/" + req.params.token);
		}

		await user.setPassword(req.body.password1);
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;
		await user.save();
		req.logIn(user, async function(){  // Can't get this to work using async
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
			await smtpTransport.sendMail(mailOptions);
			req.flash("success", "Password reset successfully");
			res.redirect("/campgrounds");
		});
	} catch (err) {
		req.flash("error", "Error resetting password: " + err.message);
		res.redirect("/campgrounds");
		console.error(err);
	}
});

router.get("/reset", middleware.isLoggedIn, function(req, res){
	res.render("reset", {action: "/reset"});
});

router.post("/reset", middleware.isLoggedIn, async function(req, res){
	try {
		if(req.body.password1 !== req.body.password2){
			req.flash("error", "Your passwords must match");
			res.redirect("/reset", {action: "/reset"});
		}

		const user = await User.findById(req.user._id);
		await user.setPassword(req.body.password1);
		await user.save();
		req.flash("success", "Password changed successfully");
		return res.redirect("/campgrounds");
	} catch (err) {
		req.flash("error", "Error changing password" + err.message);
		return res.redirect("/campgrounds");
	}
});

module.exports = router;