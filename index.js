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

// Token Verification function 
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized Access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    });
}


async function run() {
    try {
        await client.connect();
        const productsCollection = client.db("refmanudb").collection("products");
        const usersCollection = client.db("refmanudb").collection("users");
        const ordersCollection = client.db("refmanudb").collection("orders");
        const reviewsCollection = client.db("refmanudb").collection("reviews");

        // add product API
        app.post('/addProduct', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result)
        })
        //Home Product API
        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });
        // finding specific product by onClick 
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await productsCollection.findOne(filter)
            res.send(result)
        });
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await productsCollection.deleteOne(filter)
            res.send(result)
        });
        
        // Review Post API
        app.post('/review', async (req, res) => {
            const data = req.body;
            const result = await reviewsCollection.insertOne(data)
            res.send(result)
        })
        app.get('/review', async (req, res) => {
            const review = await reviewsCollection.find().toArray()
            res.send(review)
        })

        // User finding API
        app.get('/user', async (req, res) => {
            const users = await usersCollection.find().toArray()
            res.send(users)
        })
        // User info showing API
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email
            const filter = { email: email }
            const result = await usersCollection.findOne(filter)
            res.send(result)
        })
        // User info update API
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ result, token });
        })
        // Make Admin API
        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await usersCollection.findOne({ email: requester });
            if (requesterAccount.role === "admin") {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: "admin" },
                };
                const result = await usersCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else(
                res.status(403).send({message: "forbidden"})
            )

        })
        // Admin Feature API
        app.get('/admin/:email', async(req, res)=>{
            const email = req.params.email;
            const user = await usersCollection.findOne({email: email});
            const isAdmin = user.role === 'admin';
            res.send({admin: isAdmin});
        })

        app.get('/manageOrder', async(req, res)=>{
            const result = await ordersCollection.find().toArray()
            res.send(result)
        })

        app.get('/order/:email', async (req, res)=>{
            const email = req.params.email;
            const query = {client: email};
            const result = await ordersCollection.find(query).toArray()
            console.log(result);
            res.send(result);
        })

        // order post API
        app.post('/order', async (req, res) => {
            const order = req.body;       
            const result = await ordersCollection.insertOne(order)
            return res.send({ success: true, result })
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