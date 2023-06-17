const express = require("express");

const app = express();
// var ejs = require("ejs");

// const date = require(__dirname+"/date.js");
// console.log(date());

app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const https = require('https')
const _ =require("lodash")
app.use(express.static("public"));


//adding db

const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://Amit_15000:R7IxmCC3jZXqlQni@cluster0.zp9eqi6.mongodb.net/todolistDB");

//new item schema
const itemsSchema = {
  name: String,
};

// const itemSchema = new mongoose.Schema({
//     name: String
//   });

const Item = mongoose.model("Item", itemsSchema); //--using it bcz we are using database

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

// const newUser = new User({ name: 'John Doe', age: 25, email: 'johndoe@example.com' });
// newUser.save()
//   .then((result) => {
//     console.log('User created:', result);
//   })
//   .catch((error) => {
//     console.error('Error creating user:', error);
//   });

// // let queries="";    esse bas last mein change aata rahega --aage nahi barega esliye query ke place pe ab items us kar raha
// const items=["Buy Food","Cook Food","Eat Food"];
// //const array mein push ho sakta hai javascript special
// var workItems=[];

app.get("/", async function (req, res) {
  try {
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems)
        .then((result) => {
          console.log("Default Items inserted :", result);
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


//custom route

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName); // Access the value of the 'customListName' parameter
  // console.log("Dynamic route:", customListName); // Output the dynamic route to the console
  // res.send(`Dynamic route: ${customListName}`);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (foundList) {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      } else {
        const newList = new List({
          name: customListName,
          items: defaultItems,
        });
        newList.save()
          res.redirect( '/'+customListName);
      }
    })
    .catch((error)  => {
      console.error("Error finding dynamic route:", error);
    });
});
    



app.post("/", function (req, res) {
  let itemName = req.body.newItem;
  const listName = req.body.list;


  const item = new Item({
    name: itemName,
  });


  if(listName === "Today"){
    item.save();
  res.redirect("/");
}
else{

  // findOne function ka return then function ke variable ( here -- foundlist) mein aata hai ---- foundOne returns Null or found list document.
  List.findOne({ name: listName })
    .then((foundList) => {
      if (foundList) {
       foundList.items.push(item)      //ex Home route ke andar schema mein items array mein add karna hai
        foundList.save();
        res.redirect('/'+ listName)
      } 
    })
    .catch((error) => {
      console.error("Error finding dynamic route:", error);
      res.send("An error occurred while finding the dynamic route."); // Send an error response if there's an issue with finding the dynamic route
    });
}

   

 
});

app.post("/delete", function (req, res) {
  const itemId = req.body.checkbox;
  const listName = req.body.listName;


  if(listName === "Today"){
    Item.findByIdAndRemove(itemId)
    .then((deletedItem) => {
      if (deletedItem) {
        console.log("Item deleted successfully:", deletedItem);
      } else {
        console.log("Item not found.");
      }
      res.redirect('/');
    })
  }
  else{
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: itemId } } })
      .then(() => {
        res.redirect('/' + listName);
      })



  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, () => console.log(`TodoList Server Running Sucessfully`));
