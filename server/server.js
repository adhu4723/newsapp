// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const newsRoutes = require("./routes/newsRoutes");
const path=require('path')
require('dotenv').config();


const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/news', newsRoutes); // All routes prefixed with /api
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
