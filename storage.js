//  a litle app STORAGE (Semyon.M)
//  1. npm install mongoose readline-sync dotenv
//  2. node storage.js

require("dotenv").config();
const mongoose = require("mongoose");
const readlineSync = require("readline-sync");

mongoose
  .connect(
    process.env.MONGODB_CONNECT
  )
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

  // Schema Item
  const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    cost: { type: Number, required: true },
  });
  //Methods Item
  itemSchema.methods.worth = function(){
    return this.amount * this.cost;
  };

  itemSchema.methods.newArrival = function (amount){
    this.amount += amount;
  };

  // Schema Tool
  const toolSchema = new mongoose.Schema({
    usage: { type: String, required: true },
    borrowedBy: [{ type: String }],
    condition: { type: Number, min: 0, max: 100, required: true },
  });
  //Methods Tool
  toolSchema.methods = {
    ...itemSchema.methods,
    useTool: function(userName){
        if (this.condition > 15){
            this.condition -= 10
            this.borrowedBy.push(userName)
        }else{
            console.log("Tool is in poor condition.")
        }
    },
    fixTool: function(){
        this.condition += 20
    }
  };

  // Schema Material
  const materialSchema = new mongoose.Schema({
    supplier: { type: String, required: true },
    quality: { type: String, required: true },
  });
  // Method Material
  materialSchema.methods = {
    ...itemSchema.methods,
    use: function(amount){
        if (this.amount < amount) throw new Error ("Not enough material!");
        this.amount -= amount
    }
  };

  // Schema User
  const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
  });
  // Methods User
  userSchema.methods = {
    useItem: function(item) {
        item.borrowedBy.push(this.name);
    },
    usedItems: function(items) {
        return items.filter(item => item.borrowedBy.includes(this.name)).map(item => item.name);
    },
};

// Models
const Item = mongoose.model('Item', itemSchema);
const Tool = Item.discriminator('Tool', toolSchema);
const Material = Item.discriminator('Material', materialSchema);
const User = mongoose.model('User', userSchema);

// CRUD operators
async function createItem(type){
    if (type !=="tool" && type !=="material"){
       console.log ("Item : only tool or material")
       return
    }
        
    const name = readlineSync.question('Enter item name: ');
    const amount = parseInt(readlineSync.question('Enter item amount: '));
    const cost = parseFloat(readlineSync.question('Enter item cost: '));

    let item;
    if (type==='tool'){
        const usage = readlineSync.question('Enter tool usage: ');
        const condition = parseInt(readlineSync.question('Enter tool codition (1-100): '));
        item = new Tool({name, amount, cost, usage, condition});
    } else if (type==='material'){
        const supplier = readlineSync.question('Enter material supplier: ');
        const quality = readlineSync.question('Enter material quality rating: ');
        item = new Material({name, amount, cost, supplier, quality});
    };
    await item.save();
    console.log(`${type.toUpperCase()} created!`)
}

async function readItems(){
    const items = await Item.find();
    console.log(items);
}

async function updateItem(name) {
    const item = await Item.findOne({name})
    if (!item) throw new Error ("Item not found.")
    
    const nameItem = readlineSync.question('Enter new name: ');
    if (nameItem) item.name = nameItem
     const amount = parseInt(readlineSync.question('Enter new amount: '))
    if (amount) item.amount = amount
    const cost = parseFloat(readlineSync.question('Enter new cost: '));
    if (cost) item.cost = cost
    
    if (item instanceof Tool) {
        const usage = readlineSync.question('Enter new tool usage: ');
        if (usage) item.usage = usage
        const condition = parseInt(readlineSync.question('Enter new tool codition (1-100): '));
        if (condition) item.condition = condition
    }

    if (item instanceof Material) {
        const supplier = readlineSync.question('Enter new material supplier: ');
        if (supplier) item.supplier = supplier
        const quality = readlineSync.question('Enter new material quality rating: ');
        if (quality) item.quality = quality

    }

    await item.save();
    console.log("Item updated!");    
}

async function deleteItem(name){
    const result = await Item.findOneAndDelete({name});
    if (!result){
        console.log('Item not found.')
    }else{
        console.log('Item deleted')
    }
}


async function createUser() {
    const name = readlineSync.question('Enter user name: ');
    const age = parseInt(readlineSync.question('Enter user age: '));
    const user = new User({ name, age });
    await user.save();
    console.log("User created!");
}

async function useItem() {
    const userName = readlineSync.question('Enter user name: ');
    const itemName = readlineSync.question('Enter item name to use: ');
    const item = await Item.findOne({ name: itemName });
    if (!item) {
        console.log("Item not found.");
        return;
    }
    const user = await User.findOne({ name: userName });
    if (!user) {
        console.log("User not found.");
        return;
    }

    try {
        if (item instanceof Tool) {
            item.useTool(userName);
            await item.save();
            console.log(`${userName} used ${itemName}.`);
        } else {
            console.log("This item is not a tool and cannot be used.");
        }
    } catch (error) {
        console.log(error.message);
    }
}

async function viewUsedItems() {
    const userName = readlineSync.question('Enter user name to view used items: ');
    const user = await User.findOne({ name: userName });
    if (!user) {
        console.log("User not found.");
        return;
    }
    const items = await Item.find();
    const usedItems = user.usedItems(items);
    console.log(`Items used by ${userName}:`, usedItems);
}

// MAIN MENU
async function main() {
    while (true) {
        console.log(`
        Menu:
        1. Create Item (Tool/Material)
        2. Read Items
        3. Update Item
        4. Delete Item
        5. Add User
        6. Use Item
        7. View Used Items
        8. Exit
        `);
        const choice = readlineSync.question('Choose an action: ');

        if (choice === '8') break;

        switch (choice) {
            case '1':
                const type = readlineSync.question('Is it a tool or material? ').toLowerCase();
                await createItem(type);
                break;
            case '2':
                await readItems();
                break;
            case '3':
                const nameToUpdate = readlineSync.question('Enter item name to update: ');
                await updateItem(nameToUpdate);
                break;
            case '4':
                const nameToDelete = readlineSync.question('Enter item name to delete: ');
                await deleteItem(nameToDelete);
                break;
            case '5':
                await createUser();
                break;
            case '6':
                await useItem();
                break;
            case '7':
                await viewUsedItems();
                break;
            default:
                console.log("Invalid choice, please try again.");
        }
    }
}

main().catch(console.error);