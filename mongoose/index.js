require("dotenv").config();

const uri = process.env.MONGODB;
const mongoose = require("mongoose");

exports.connect = () => {
  mongoose
    .connect(
      "mongodb+srv://harshul:Cgq6zpWkNt18p4gW@cluster0.n6vhnhg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    .then(() => {
      console.log("Successfully connected to database");
    })
    .catch((error) => {
      console.log("database connection failed. exiting now...");
      console.error(error);
      process.exit(1);
    });
};
