const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0rjro.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    console.log('abc');
}

async function run() {
    try {
        await client.connect();
        const productsCollection = client.db("refmanudb").collection("products");
        const usersCollection = client.db("refmanudb").collection("users");
        const ordersCollection = client.db("refmanudb").collection("orders");

        app.get('/product', async (req, res)=>{
            const query = {};
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        app.get('/product/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await productsCollection.findOne(filter)
            res.send(result)
        });

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email
            const filter = { email: email }
            const result = await usersCollection.findOne(filter)
            res.send(result)
        });
        
        app.get('/orders', async (req, res)=>{
            const client = req.query.client;
            const query = {client: client};
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders)
        });

        app.put('/user/:email', async (req, res)=>{
            const email = req.params.email;
            const user = req.body;
            const filter = {email: email};
            const options = {upsert: true};
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            const token =jwt.sign({email: email}, process.env.TOKEN_SECRET, {expiresIn: '3h'});
            res.send({result, token});
        });
        app.post('/order', async(req, res) => {
            const order = req.body;
            const query = {name: order.name}
            const exists = await ordersCollection.findOne(query);
            if(exists){
                return res.send({success: false, order: exists})
            }
            const result = await ordersCollection.insertOne(order)
            return res.send({success: true, result})
        })
        
    } finally {
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Refrigerator Manufacturing app listening on port ${port}`)
})