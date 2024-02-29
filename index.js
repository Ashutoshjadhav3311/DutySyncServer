
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



const client = new MongoClient(uri);

async function main() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    //await listDatabases(client);
    // Send a ping to confirm a successful connection
    //await client.db("admin").command({ ping: 1 });
    console.log(" You successfully connected to MongoDB!");4
    const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
console.log(`Server is running on port ${PORT}`);
});
} catch (error) {
  console.error("Error connecting to MongoDB:", error);
}
}

  

async function listDatabases(client) {
databasesList = await client.db().admin().listDatabases();

console.log("Databases:");
databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};

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
const insert=await client.db("DutySyncHouse").collection("Role").insertOne( { Housename: housename } );
// add housename in roles collection as well
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
  const result=await client.db("DutySyncHouse").collection("HouseList").findOneAndUpdate(
    { Housename: houseData.Housename }, 
  { $push: { Membername: houseData.Membername } }, 
  { new: true },)
  console.log("addHouseMemeber",result)
  // Call createHouse function to insert the new house data
  

  res.status(201).json({ message: result });
} catch (error) {
  console.error(error);
  res.status(500).json({ error: 'Internal server error :Coudld not add housemember' });
}
});

app.post('/saveRoles',async(req,res)=>{
  try {
  const  roles  = req.body;
  console.log("req body",roles)
  const result=await client.db("DutySyncHouse").collection("Role").findOneAndUpdate(
    { Housename: roles.Housename }, 
    
  {$set: { RolesNames: roles.RolesNames ,
  Frequency:roles.Frequency}
},    //$set overwrites the existing data
  { new: true },) 
  console.log(roles)
  console.log(result)
  if(result){
    return res.status(201).json({ message: 'Roles saved sucessfully' });
  }
   
   res.status(400).json({ message: 'housename not present in database' });
}
   catch(error){
    res.status(500).json({ error: 'Internal server error :Coudld not add roles' });
   }
})

app.delete('/removeHouseMember',async(req,res)=>{

    try {
      const housedata = req.body;
      
      const houseName=housedata.Housename;
      console.log("houseName:",houseName)
      const memberName=housedata.Membername;
      const result = await client.db("DutySyncHouse").collection("HouseList").findOneAndUpdate(
      { Housename: houseName },
      { $pull: { Membername: memberName } },
      { new: true }
    );
        console.log("removeHousemember:",result)
    if (result) {
      return res.status(200).json({ message: `Member ${memberName} successfully removed from the house ${houseName}` });
      
    }
    res.status(404).json({ error: `House ${houseName} not found` });
    
  } catch (error) {
    console.error('Error removing member from the house:', error);
    res.status(500).json({ error: 'Internal server error: Could not remove member from the house' });
  }
})

app.post('/assignRolesToHouseMembers', async (req, res) => {
  try {
    const  houseName  = req.body;
    
    const houseDetails = await client.db("DutySyncHouse").collection("HouseList").findOne({ Housename: houseName.Housename });
    if (!houseDetails) {
      return res.status(404).json({ error: `House ${houseName} not found` });
    }
  
    const roles = await client.db("DutySyncHouse").collection("Role").findOne({ Housename: houseName.Housename });
    console.log("roles",roles)
    if (!roles || !roles.RolesNames) {
      return res.status(404).json({ error: `Roles not found for house ${houseName.Housename}` });
    }
   

    const assignedRoles = {};
    const startDate = new Date();
    houseDetails.Membername.forEach((member, index) => {
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + roles.Frequency);
      assignedRoles[member] = { role: roles.RolesNames[index] || 'No role assigned', startDate: startDate.toISOString(),endDate:endDate.toISOString() };
    });
    const result = await client.db("DutySyncHouse").collection("AssignedRoles").updateOne(
      { Housename: houseName.Housename },
      { $set: assignedRoles },
      { upsert: true } // Createnew doc if it doesn't exist
    );

    res.status(200).json({ message: 'Roles assigned to house members successfully' });
  } catch (error) {
    console.error('Error assigning roles to house members:', error);
    res.status(500).json({ error: 'Internal server error: Could not assign roles to house members' });
  }
});

app.get('/getroles/:houseName',async(req,res)=>{
  try{
    const houseName = req.params.houseName;
    const result=await client.db("DutySyncHouse").collection("AssignedRoles").findOne({ Housename: houseName });
    res.status(200).json(result);
  }
  catch{

    console.error(error);
  res.status(500).json({ error: 'Internal server error :Coudld not  house roles' });
  }
})
main().catch(console.dir);
module.exports = app;