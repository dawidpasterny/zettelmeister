const express = require('express')
const bodyParser = require("body-parser");
const path = require("path");
const routes = require('./routes')
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(routes)

app.listen(3000)