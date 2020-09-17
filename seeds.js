const mongoose   = require("mongoose"),
	  Campground = require("./models/campground"),
	  Comment    = require("./models/comment"),
	  User       = require("./models/user");

const data = [
	{
		name: "Cloud's Rest",
		image: "https://images.pexels.com/photos/699558/pexels-photo-699558.jpeg?auto=compress&cs=tinysrgb&h=350",
		price: 9.00,
		description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
	},
	{
		name: "Generic Campground",
		image: "https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&cs=tinysrgb&h=350",
		price: 9.00,
		description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
	},
	{
		name: "Woods and Tents",
		image: "https://images.pexels.com/photos/1230302/pexels-photo-1230302.jpeg?auto=compress&cs=tinysrgb&h=350",
		price: 9.00,
		description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
	}
];

function seedDB(){
	Campground.remove({}, function(err){
		Comment.remove({}, function(err){
			User.findOne({username: "Homer"}, function(err, user){
				if(err){
					console.log("Error finding user homer: " + err);
				} else {
					for(let i = 0; i < data.length; i++){
						Campground.create(data[i], function(err, campground){
							if(err){
								console.log(err);
							} else {
								Comment.create({
									text: "This place is great, but I wish there was internet.",
								}, function(err, comment){
									if(err){
										console.log(err);
									} else {
										comment.author.id = user._id;
										comment.author.username = user.username;
										comment.save();
										campground.comments.push(comment);
										campground.author.id = user._id;
										campground.author.username = user.username;
										campground.save();
									}
								});
							}
						});
					}
				}
			});
		});
	});
	
	
}

module.exports = seedDB;