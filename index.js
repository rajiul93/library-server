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

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).send({ message: "unauthorized access" });
  if (token) {
    jwt.verify(token, process.env.DB_SECRET, (err, decoded) => {
      if (err) { 
        return res
          .status(401)
          .send({ message: "unauthorized access invalid " });
      }

      req.user = decoded;
      next();
    });
  }
};

async function run() {
  try {
    const database = client.db("library");
    const bookCollection = database.collection("bookCollection");
    const categoryCollection = database.collection("categoryCollection");
    const borrowedCollection = database.collection("borrowedCollection");
    const userCollection = database.collection("userCollection");

    // jwt .......................................................................
    app.post("/jwt", async (req, res) => {
      const user = req.body; 
      const token = jwt.sign(user, process.env.DB_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: "true" });
    });

    app.get("/log-uot", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          maxAge: 0,
        })
        .send({ success: "true" });
    });
    //   jwt finish
    // user manage api........................................
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };

      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.post("/user", async (req, res) => {
      const data = req.body; 
      const newData = { role: "user" };
      const doc = { ...data, ...newData };
      const result = await userCollection.insertOne(doc);
      res.send(result);
    });

    // book creating sector..........................................
    // use hear jwt for condition
    app.get("/book",verifyToken, async (req, res) => {
      const email = req.query?.email

      const tokenData = req.user.email; 
      if (tokenData !== email) {
       return res
       .status(403)
       .send({ message: "forbidden access" })
      }

      const result = await bookCollection.find().toArray();
      res.send(result);
    });



    app.get("/books",  async (req, res) => {
      
      const result = await bookCollection.find().toArray();
      res.send(result);
    });




    // new book page add api hear use jwt
    app.post("/book", verifyToken, async (req, res) => {
      const newData = req.body;

      const tokenData = req.user.email;
      if (tokenData !== newData.email) {
       return res
       .status(403)
       .send({ message: "forbidden access" })
      }

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
        projection: {
          title: 1,
          image: 1,
          authorName: 1,
          category: 1,
          rating: 1,
          shortDescription: 1,
        },
      };
      const query = { category: category };
      const result = await bookCollection.find(query, options).toArray();
      res.send(result);
    });

    // book borrowed sector................................................

    app.get("/borrow/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };

      const result = await borrowedCollection.find(query).toArray();
      res.send(result);
    });

    app.patch("/borrow/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const quantity = data.newQuantity; 
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          quantity: quantity,
        },
      };

      const options = { upsert: true };
      const result = await bookCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.post("/borrow", async (req, res) => {
      const newData = req.body; 
      const result = await borrowedCollection.insertOne(newData);
      res.send(result);
    });

    app.delete("/borrow-return/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await borrowedCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 }); 
  } finally { 
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(` server is running ${port}`);
});
