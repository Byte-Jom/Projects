const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/toDoListDB", {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
});

const itemSchema = new mongoose.Schema({
	name: String,
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
	name: "item1",
});

const item2 = new Item({
	name: "item2",
});

const item3 = new Item({
	name: "item3",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
	name: String,
	itemArray: [itemSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
	Item.find({}, (err, items) => {
		if (err) {
			console.log(err);
		} else {
			if (items.length === 0) {
				Item.insertMany(defaultItems, (err) => {
					if (err) {
						console.log(err);
					} else {
						console.log("Successfully logged default items into the database!");
					}
				});
				res.redirect("/");
			} else {
				res.render("list", { listTitle: "Today", newListItems: items });
			}
		}
	});
});

app.get("/about", function (req, res) {
	res.render("about");
});

app.get("/:listTitle", function (req, res) {
	const listTitle = _.lowerCase(req.params.listTitle);
	List.findOne({ name: listTitle }, (err, foundList) => {
		if (err) {
			console.log(err);
		} else {
			if (!foundList) {
				const list = new List({
					name: listTitle,
					itemArray: defaultItems,
				});
				list.save();
				res.redirect("/" + listTitle);
			} else {
				if (foundList.itemArray.length === 0) {
					List.updateOne(
						{ name: listTitle },
						{ itemArray: defaultItems },
						(err, results) => {
							if (err) {
								console.log(err);
							} else {
								console.log("Successfully updated custom list!");
							}
						}
					);
					res.redirect("/" + listTitle);
				} else {
					res.render("list", {
						listTitle: _.startCase(foundList.name),
						newListItems: foundList.itemArray,
					});
				}
			}
		}
	});
});

app.post("/", function (req, res) {
	const listTitle = _.lowerCase(req.body.listTitle);
	const item = req.body.newItem;
	const newItem = new Item({
		name: item,
	});
	if (listTitle === "today") {
		newItem.save();
		res.redirect("/");
	} else {
		List.findOne({ name: listTitle }, (err, foundList) => {
			if (err) {
				console.log(err);
			} else {
				foundList.itemArray.push(newItem);
				foundList.save();
			}
		});
		res.redirect("/" + listTitle);
	}
});

app.post("/delete", (req, res) => {
	const itemID = req.body.checkbox;
	const listTitle = _.lowerCase(req.body.listTitle);
	if (listTitle === "today") {
		Item.findByIdAndRemove(itemID, (err) => {
			if (err) {
				console.log(err);
			}
		});
		res.redirect("/");
	} else {
		List.findOneAndUpdate({ name: listTitle }, {$pull: {itemArray: {_id: itemID}}}, (err, foundList) => {
			if (err) {
				console.log(err);
			}
		});
		res.redirect("/" + listTitle);
	}
});

app.listen(3000, function () {
	console.log("Server started on port 3000");
});
