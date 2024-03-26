const express = require("express");
const cookieParser = require("cookie-parser");
const http = require("http");
const app = express();
app.use(cookieParser());

const dotenv = require("dotenv");
const path = require("path");
const socketio = require("socket.io");
const userRoutes = require("./routes/userRoutes");

require("./mongoose/index").connect();

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

dotenv.config();
const server = http.createServer(app);
const io = socketio(server, {
  pingTimeout: 600000,
});

app.get("/api/test", (req, res) => {
  res.send("testing");
});

// ------------------ APIs ----------------------

app.use("/api/", userRoutes);

// ------------------ Deployment ----------------------

app.use(express.static(path.join(__dirname, "..", "build")));
app.use(express.static(path.join(__dirname, "../public")));
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "..", "build", "index.html"));
});

app.listen(3000, () => {
  console.log("server started on port 3000");
});
