
  const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
  const cors = require('cors');
  const express = require('express');
  const app = express();
  // Middleware to parse JSON request body
  app.use(express.json());
  app.use(cors({
    origin: ['http://localhost:3000', 'https://dutysync.netlify.app']
  }));
  // Create a MongoClient with a MongoClientOptions object to set the Stable API version
const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGODB_PASSWORD;
const uri = `mongodb+srv://${username}:${password}@cluster0.hgwnc0j.mongodb.net/?retryWrites=true&w=majority`;

//const uri = "mongodb+srv://${username}:${password}@cluster0.hgwnc0j.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);




async function main() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    //await listDatabases(client);
    // Send a ping to confirm a successful connection
    //await client.db("admin").command({ ping: 1 });
    console.log(" You successfully connected to MongoDB!");4
    
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
async function createHouse(client, newHouse){
  const result = await client.db("DutySyncHouse").collection("HouseList").insertOne( newHouse );
  console.log("name of the house is",newHouse )
  console.log(`New listing created with the following id: ${result.insertedId}`);
}

async function listDatabases(client) {
databasesList = await client.db().admin().listDatabases();

console.log("Databases:");
databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};

async function addHouseMember(client, newHouse){
  console.log("name of the house is",newHouse.Housename)
  console.log("name of the Member is",newHouse.Membername)
  const result=await client.db("DutySyncHouse").collection("HouseList").findOneAndUpdate(
    { Housename: newHouse.Housename }, 
  { $push: { Membername: newHouse.Membername } }, 
  { new: true },)
  
  console.log('addhousemember:',result)
}

async function getHouseMembers(client, houseName){
  const result=await client.db("DutySyncHouse").collection("HouseList").findOne({ Housename: houseName });
}

//APIs
// Ping endpoint to keep server active on render
app.get('/ping', (req, res) => {
res.status(200).send('Server is alive!');
});

app.post('/createHouse', async (req, res) => {
try {
  const  houseData  = req.body;
  console.log  (houseData);
  // Call createHouse function to insert the new house data
  await createHouse(client, houseData);

  res.status(201).json({ message: houseData });
} catch (error) {
  console.error(error);
  res.status(500).json({ error: 'Internal server error :Coudld not add houseName' });
}
});

app.post('/addHouseMember', async (req, res) => {
try {
  const  houseData  = req.body;
  console.log  (houseData);
  await addHouseMember(client, houseData);
  // Call createHouse function to insert the new house data
  

  res.status(201).json({ message: houseData });
} catch (error) {
  console.error(error);
  res.status(500).json({ error: 'Internal server error :Coudld not add housemember' });
}
});
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
console.log(`Server is running on port ${PORT}`);
});
main().catch(console.dir);
module.exports = app;
