const express = require('express');
const bodyParser = require('body-parser')
const fs = require('fs');

const router = express.Router();

router.get("/data", (req,res,next)=>{
    fs.readFile('data.json', 'utf8', (err, data) => res.send(data))
})

router.get("/", (req,res,next)=>{
    res.render('index')
})


router.use((req,res,nex)=>{ //handle all other requests with a 404 error
    res.status(404).send()
})

module.exports = router