const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const https = require('https');
const _ = require("lodash");
const mongoose = require("mongoose");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://Amit_15000:R7IxmCC3jZXqlQni@cluster0.zp9eqi6.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "Welcome to your todoList",
});
const item2 = new Item({
  name: "Hit the + button to add a new item",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item.>",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);

app.get("/", async function (req, res) {
  try {
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems)
        .then((result) => {
          console.log("Default Items inserted:", result);
        })
        .catch((error) => {
          console.error("Error inserting items:", error);
        });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.error(err);
  }
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (foundList) {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      } else {
        const newList = new List({
          name: customListName,
          items: defaultItems,
        });
        newList.save();
        res.redirect('/' + customListName);
      }
    })
    .catch((error) => {
      console.error("Error finding dynamic route:", error);
    });
});

app.post("/", function (req, res) {
  let itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        if (foundList) {
          foundList.items.push(item);
          foundList.save();
          res.redirect('/'+listName);
        }
      })
      .catch((error) => {
        console.error("Error finding dynamic route:", error);
        res.send("An error occurred while finding the dynamic route.");
      });
  }
});

app.post("/delete", function (req, res) {
  const itemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(itemId)
      .then((deletedItem) => {
        if (deletedItem) {
          console.log("Item deleted successfully:", deletedItem);
        } else {
          console.log("Item not found.");
        }
        res.redirect('/');
      });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: itemId } } })
      .then(() => {
        res.redirect('/' + listName);
      });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, () => console.log("TodoList Server Running Successfully"));
