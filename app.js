//jshint esversion:6

// Uncomment this line when testing on localhost:3000, else it will conflict
// with the environment variables setup in Heroku!
//require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// ----------------------------------------------------------------------------
// mongodb
// ----------------------------------------------------------------------------

// Connect to MongoDB
const mongodbURL = "mongodb+srv://admin-todo:" + process.env.MY_KEY + "@todocluster-td7mb.mongodb.net/todolistDB"
const mongodbLocalURL = "mongodb://localhost:27017/todolistDB"

// console.log(mongodbURL);

mongoose.connect(mongodbURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Mongoose Schema and Model
const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "To do item 1"
});

const item2 = new Item({
  name: "To do item 2"
});

const item3 = new Item({
  name: "To do item 3"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

// ----------------------------------------------------------------------------
// Routes
// ----------------------------------------------------------------------------

app.get("/", function(req, res) {
  // Find all
  Item.find({
    // condition
  }, function(err, items) {
    if (items.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Database inserted successfully.");
        }
      });
      res.redirect("/"); // redirect back to / route
    } else {
      res.render('list', {
        listTitle: "Today",
        items: items
      });
    }

    // if (err) {
    //   console.log(err);
    // } else {
    //   items.forEach(function(item){
    //     console.log(item.name);
    //   })
    // }
  });
});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listTitle = req.body.listButton;

  const newItem = new Item({
    name: itemName
  });

  if (listTitle === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    // New item from custom list
    List.findOne({
      name: listTitle
    }, function(err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listTitle);
    });
  }

  // newItem.save();
  //
  // res.redirect("/");

  // if (req.body.listButton === 'Work') {
  //   workItems.push(todo);
  //   res.redirect("/work");
  // } else {
  //   todoItems.push(todo);
  //   res.redirect("/");
  // }
});

app.post("/delete", function(req, res) {
  const checkedItemID = req.body.checkedItem;
  const listTitle = req.body.listTitle;

  if (listTitle === "Today") {
    Item.findByIdAndRemove(checkedItemID, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("DEBUG: " + checkedItemID + " successfully removed.");
      }
    });

    res.redirect("/");
  } else {
    List.findOneAndUpdate({
        name: listTitle
      }, {
        $pull: {
          items: {
            _id: checkedItemID
          }
        }
      },
      function(err, foundList) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/" + listTitle);
        }
      });
  }
});

app.get('/:customListTitle', function(req, res) {
  const customListTitle = lodash.capitalize(req.params.customListTitle);

  List.findOne({
    name: customListTitle
  }, function(err, foundList) {
    if (err) {
      console.log(err);
    } else {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListTitle,
          items: defaultItems
        });

        list.save();

        res.redirect("/" + customListTitle);
      } else {
        // Show existing list
        res.render("list", {
          listTitle: foundList.name,
          items: foundList.items
        })
      }
    }
  })
});

// app.get("/work", function(req, res) {
//   res.render('list', {listTitle: "Work", items: workItems});
// });

// app.post("/work", function(req, res) {
//   const todo = req.body.todo;
//   workItems.push(todo);
//   res.redirect("/work");
// });

// app.get("/about", function(req, res) {
//   res.render("about");
// });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully.");
});
