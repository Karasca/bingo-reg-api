var express = require('express');
var router = express.Router();
let registrations = [];
let open = false;

/* GET registrations JSON. */
router.get('/', function(req, res, next) {
    res.send(registrations);
});

/* GET registrations JSON. */
router.post('/', function(req, res, next) {
    console.log(`received post: ${req.body}`)

    if(req.body.access_token == process.env.ACCESS_TOKEN && open){
        let registration = {
            "username": req.body.username,
            "seed": req.body.seed
        }
        registrations.push(registration);
        res.status(200).send(registrations);
     }
     else{
         res.status(403).send;
    }

});

router.post('/clear', function(req, res, next) {
    if(req.body.access_token == process.env.ACCESS_TOKEN){
        registrations = []
        res.status(200).send("Registrations cleared")
    }
    else{
        res.status(403).send;
    }

});

router.post('/open', function(req, res, next) {
    if(req.body.access_token == process.env.ACCESS_TOKEN){
        open = true;
        res.status(200).send("Opened registrations")
    }
    else{
        res.status(403).send;
    }

});

router.post('/close', function(req, res, next) {
    if(req.body.access_token == process.env.ACCESS_TOKEN){
        open = false;
        res.status(200).send("Closed registrations")
    }
    else{
        res.status(403).send;
    }

});

module.exports = router;