const mongoose = require("mongoose");

const campgroundSchema = new mongoose.Schema({
	name: String,
	image: String,
	description: String,
	price: String,
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "comment"
		}
	]
});

module.exports = mongoose.model("campground", campgroundSchema);
