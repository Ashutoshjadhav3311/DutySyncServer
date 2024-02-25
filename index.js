
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
const uri = "mongodb+srv://${username}:${password}@cluster0.hgwnc0j.mongodb.net/?retryWrites=true&w=majority";

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
  console.log('addhousemember housename is :',newHouse.Housename)
  console.log('addhousemember membername is :',newHouse.Membername)
  console.log('addhousemember:',result)
}

async function getHouseMembers(client, houseName){
  const result=await client.db("DutySyncHouse").collection("HouseList").findOne({ Housename: houseName });
  return result;
}

async function checkMember(client, membername){
  const result=await client.db("DutySyncHouse").collection("HouseList").findOne({ Membername: membername });
  return result;
}
//APIs
// Ping endpoint to keep server active on render
app.get('/ping', (req, res) => {
res.status(200).send('Server is alive!');
});

app.get('/checkHouseMember/:membername',async(req,res)=>{
  try{
    const membername = req.params.membername;
    console.log('Membername:',membername)
    const result = await checkMember(client, membername);
    if(result==null){
      res.status(400).json("Member not in any house");
      return;
    }
    res.status(200).json(result);
      console.log('getHouseMembers:',result.Housename)
    
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error :Coudld not get house members' });
}});

app.get('/getHouseMembers/:houseName', async (req, res) => {
try{
  const houseName = req.params.houseName;
  console.log('houseName:',houseName)
  const result = await getHouseMembers(client, houseName);
  res.status(200).json(result);
  console.log('getHouseMembers:',result)
}
catch (error) {
  console.error(error);
  res.status(500).json({ error: 'Internal server error :Coudld not get house members' });
}});

app.post('/createHouse', async (req, res) => {
try {
  const  houseData  = req.body;
//  console.log  (houseData);
  const housename= houseData.Housename
 // console.log(housename)
  const existing= await client.db("DutySyncHouse").collection("HouseList").findOne( {Housename:housename} );
  console.log("existing",existing)
  if (existing){
    return res.status(400).json({ message: 'Data already exists' });
}
const result = await client.db("DutySyncHouse").collection("HouseList").insertOne( houseData );
//  console.log("name of the house is",houseData )
//  console.log(`New listing created with the following id: ${result.insertedId}`);
  res.status(201).json({ message: 'Data saved successfully' });
  } 
 catch (error) {
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
