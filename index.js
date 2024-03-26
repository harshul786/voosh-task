const express = require("express");
const cookieParser = require("cookie-parser");
const http = require("http");
const app = express();
app.use(cookieParser());

const userRoutes = require("./routes/userRoutes");

require("./mongoose/index").connect();

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.get("/api/test", (req, res) => {
  res.send("testing");
});

app.use("/api/", userRoutes);

// ------------------ Deployment ----------------------

app.listen(3000, () => {
  console.log("server started on port 3000");
});
