const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 9000;
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

const corsOption = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://libraryan.netlify.app",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOption));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello world");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.hefn8jo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// const verifyToken = (req, res, next) => {
//   const token = req.cookies.token;
//   if (!token) return res.status(401).send({ message: "unauthorized access" });
//   if (token) {
//     jwt.verify(token, process.env.SECRET_TOKEN, (err, decode) => {
//       if (err) {
//         console.log(err);
//         return res
//           .status(401)
//           .send({ message: "unauthorized access invalid " });
//       }
//       console.log(decode);
//       req.user = decode;
//       next();
//     });
//   }
// };

async function run() {
  try {
    const database = client.db("library");
    const bookCollection = database.collection("bookCollection");
    const categoryCollection = database.collection("categoryCollection");
    const borrowedCollection = database.collection("borrowedCollection");

    // jwt .......................................................................

    //   jwt finish

    // book creating sector..........................................
    app.get("/book", async (req, res) => {
      const result = await bookCollection.find().toArray();
      res.send(result);
    });

    app.post("/book", async (req, res) => {
      const newData = req.body;
      const result = await bookCollection.insertOne(newData);
      res.send(result);
    });

    app.get("/book/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.findOne(query);
      res.send(result);
    });
    app.get("/my-book/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await bookCollection.find(query).toArray();
      res.send(result);
    });

    app.patch("/my-book/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          ...data,
        },
      };

      const options = { upsert: true };
      const result = await bookCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.delete("/book/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.deleteOne(query);
      res.send(result);
    });
    //  book category sector ./.................................................

    app.get("/book-category", async (req, res) => {
      const result = await categoryCollection.find().toArray();
      res.send(result);
    });
    app.get("/same-category/:category", async (req, res) => {
      const category = req.params.category;
   
      const options = {
        projection: { title: 1, image: 1, authorName: 1, category: 1,rating:1,shortDescription:1 },
      };
      const query = { category: category };
      const result = await bookCollection.find(query,options).toArray()
      res.send(result);
    });

    // book borrowed sector................................................


    app.get("/borrow/:email", async (req, res) => {
        const email = req.params.email
      const query = { email: email};

        const result = await borrowedCollection.find(query).toArray();
        res.send(result);
      });

    app.patch("/borrow/:id", async (req, res) => {
        const id = req.params.id;
        const data = req.body;
        const quantity =data.newQuantity;
        console.log(id, data);
        const filter = { _id: new ObjectId(id) };
  
        const updateDoc = {
          $set: {
            quantity: quantity
          },
        };
  
        const options = { upsert: true };
        const result = await bookCollection.updateOne(filter, updateDoc, options);
        res.send(result);
      });



    app.post("/borrow", async (req, res) => {
        const newData = req.body;
        console.log(newData);
        const result = await borrowedCollection.insertOne(newData);
        res.send(result);
      });

    await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(` server is running ${port}`);
});
