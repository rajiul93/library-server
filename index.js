const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 9000;
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

const corsOption = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
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


    // jwt .......................................................................

    //   jwt finish


    // book creating sector..........................................
    app.post("/book", async (req, res) => {
        const newData = req.body; 
        const result = await bookCollection.insertOne(newData);
        res.send(result);
      });


    // book borrowed sector................................................


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
