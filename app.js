//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose= require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.set('useUnifiedTopology', true); //avoiding deprecation warnings
mongoose.connect("mongodb+srv://admin-akanksha:Cmpf123@cluster0.sa5ab.mongodb.net/todolistdb",{useNewUrlParser:true},{ useFindAndModify: false});

const itemsSchema = new mongoose.Schema({
  name : String
});
const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name : "Welcome to your todolist"
});

const item2 = new Item({
  name : "Hit the + button to add new items"
});

const item3 = new Item({
  name : "<-- Hit this to delete an item"
});

const defaultItem=[item1,item2,item3];

const listScheme = new mongoose.Schema({
  name :String,
  items: [itemsSchema]
});
const List = mongoose.model("List", listScheme);
// Item.insertMany(defaultItem,function(err){
//   if(err){
//     console.log(err);
//   }
//   else{
//     console.log("Inserted default");
//   }
// });
app.get("/", function(req, res) {

  Item.find({},function(err,foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItem,function(err){
        if(err){
          console.log(err);
        }
        else{
          console.log("Inserted default");
        }
      });
      res.redirect("/");
    }
    else{
      res.render("list", {listTitle: "Today" , newListItems: foundItems});
    //console.log(foundItems);
    }

  });

});

app.get("/:customListName",function(req,res){
  //console.log(req.params.customListName);
  const customListName = _.capitalize(req.params.customListName);

//go to the list we want
  List.findOne({name : customListName},function(err,foundList){
    if(!err){
      if(!foundList){
      //Create a new list
      const list= new List({
        name: customListName,
        items: defaultItem
      });
      list.save();
      res.redirect("/"+customListName)
      }
      else{
        //Show an existing list
        res.render("list",{listTitle: foundList.name, newListItems: foundList.items})
        //console.log("Exists");
      }
    }
  })



});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName= req.body.list;
  const item = new Item({
    name : itemName
  });
//add items to the desired list
//add in the default list
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }
  else{
    //find the custom list and add item
    List.findOne({name : listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);   //takes back to app get
    });
  }
});

app.post("/delete",(req,res)=>{
  //console.log(req.body.checkbox);

  const checkedItemId = req.body.checkbox; //id of the item to be removed
  const listName = req.body.listName;  //name of list from which item to be removed

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId,function(err){
      if(!err){
        console.log("Successfully deleted checked Item");
        res.redirect("/");
      }
    });
  }
  else{
    List.findOneAndUpdate({name : listName},{$pull : {items : {_id : checkedItemId}}},function(err,foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }

})



// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
