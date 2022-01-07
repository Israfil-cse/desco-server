const express = require("express");
const cors = require("cors");
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


// connect to the database
const uri = `mongodb+srv://desco:desco123@cluster0.ovcmn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

console.log(uri);

async function run() {
    try {
        await client.connect();
        const database = client.db("desco");
        const billingsCollection = database.collection("billings");
        const registerUserCollection = database.collection("register");

        // add a bill
        app.post('/api/add-billing', async (req, res) => {
            const bill = req.body;
            const result = await billingsCollection.insertOne(bill);
            res.send(result);
        })

        app.get('/api/billing-list', async (req, res) => {
            let { page, size } = req.query;
            if (!page) {
                page = 1
            }
            if (!size) {
                size = 4
            }
            const count = await billingsCollection.find({}).count();
            const limit = parseInt(size)
            const skip = page * size;
            const result = await billingsCollection.find({}, { limit: limit, skip: skip }).toArray();
            res.send({
                count,
                result
            });
        })

        //remove a bill
        app.delete('/api/delete-billing/:id', async (req, res) => {
            const id = req.params.id;
            const result = await billingsCollection.deleteOne({ _id: ObjectId(id) });
            res.json(result);
        })



        app.get('/allBillings', async (req, res) => {
            const result = await billingsCollection.find({}).toArray();
            res.send(result);
        })

        // find specific user to update
        app.get("/allBillings/:id", async (req, res) => {
            const id = req.params.id;
            const result = await billingsCollection.findOne({ _id: ObjectId(id) });
            res.send(result);
        });


        // status update
        app.put("/api/update-billing/:id", async (req, res) => {
            const id = req.params.id;
            const updateBody = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    name: updateBody.name,
                    email: updateBody.email,
                    phone: updateBody.phone,
                    amount: updateBody.amount,
                },
            };
            const result = await billingsCollection.updateOne(
                filter,
                updateDoc,
            );
            res.json(result);
        });

        // register user
        app.post("/api/registration", async (req, res) => {
            const { name, email, password } = req.body

            const exist = await registerUserCollection.findOne({ email: email })
            console.log(exist);
            if (exist) {
                res.send({ message: "User already registered" })
            }
            else {
                const result = await registerUserCollection.insertOne({ name, email, password })
                res.send(result);
            }
        })

        //login user
        app.post("/api/login", (req, res) => {
            const { email, password } = req.body
            registerUserCollection.findOne({ email: email }, (err, user) => {
                if (user) {
                    if (password === user.password) {
                        res.send({ message: "Login Successful", user: user })
                    } else {
                        res.send({ message: "Password didn't match" })
                    }
                } else {
                    res.send({ message: "User not registered" })
                }
            })
        })

    }

    finally {
        // await client.close();
    }
}
run().catch(console.dir)

app.get("/", (req, res) => {
    res.send("server running successfully");
});

app.listen(port, () => {
    console.log("listening on port", port);
});
