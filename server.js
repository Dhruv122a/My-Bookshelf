// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const bookRoutes = require("./routes/bookRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ▼▼▼ NEW CODE BLOCK ▼▼▼
// This tells the server to send 'welcome.html' when someone visits the root URL ('/')
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});


// This serves everything in your 'public' folder (HTML, CSS, JS, and the assets folder inside it)
app.use(express.static('public'));

// This serves your user-uploaded books
app.use('/uploads', express.static('uploads'));

app.use("/users", userRoutes);
app.use("/books", bookRoutes);
app.use("/orders", orderRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT,() => console.log(`Server running at http://localhost:${PORT}`));