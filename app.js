let express          = require("express"),
	app              = express(),
	bodyParser       = require("body-parser"),
	mongoose         = require("mongoose"),
	Campground       = require("./models/campground"),
	Comment          = require("./models/comment"),
	seedDB           = require("./seeds"),
	passport         = require("passport"),
	LocalStrategy    = require("passport-local"),
	User             = require("./models/user"),
	expressSession   = require("express-session"),
	methodOverride   = require("method-override"),
	expressSanitizer = require("express-sanitizer"),
	flash            = require("connect-flash");

let indexRoutes      = require("./routes/index"),
	campgroundRoutes = require("./routes/campgrounds"),
	commentRoutes    = require("./routes/comments");

mongoose.connect("mongodb+srv://testUsername:testPassword@cluster0.kofvz.mongodb.net/Cluster0?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(expressSession({
	secret: "This is a secret apparently...",
	resave: false,
	saveUninitialized: false
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next){
	res.locals.user = req.user;
	res.locals.successMessage = req.flash("success");
	res.locals.dangerMessage = req.flash("error");
	next();
});
app.use(methodOverride("_method"));
app.use(expressSanitizer());
app.use(indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

app.set("view engine", "ejs"); 

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

seedDB();

app.listen(process.env.PORT || 3000, function(){
	console.log("Listening on port 3000"); 
});