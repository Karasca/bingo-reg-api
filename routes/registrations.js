const express = require('express');
const router = express.Router();

let registrations = [];
let clients = [];
let open = false;

// The event stream endpoint
router.get('/', function(req, res) {
    const headers= {
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive'
    };

    res.writeHead(200, headers);

    // write whole registration array to listener
    res.write(`event: message\n`);
    res.write(`data: ${JSON.stringify(registrations)}\n\n`);

    // write bingo status to listener
    if(open){
        res.write(`event: open-bingo\n`)
        res.write(`data: bingo opened\n\n`)
    }else{
        res.write(`event: close-bingo\n`)
        res.write(`data: bingo closed\n\n`)
    }
    //console.log(data);

    // res.write(data)

    const clientId = Date.now();

    const newClient = {
        id: clientId,
        response: res
    };

    console.log(newClient.id)

    clients.push(newClient);

    req.on('close', () => {
        console.log(`${clientId} Connection closed`);
        clients = clients.filter(client => client.id !== clientId);
    });
});

// save registration and send to all connections
router.post('/', function (req, res) {
    if(req.body.access_token === process.env.ACCESS_TOKEN){
        console.log(req.body.username)
        if(!registrations.find(e => e.username === req.body.username)){
            console.log("yo")
            const newReg = req.body
            newReg.access_token = undefined
            registrations.push(newReg);
            res.json(registrations)
            return sendEventsToAll(registrations);
        }else{
            res.status(400).send("username already registered")
        }
    }
    else{
        res.status(403).send;
    }
});

function sendClearEventToAll() {
    clients.forEach(client => {
            client.response.write(`event: clear\n`);
            client.response.write(`data: registrations cleared\n\n`)
        }
    )
}

router.post('/clear', function(req, res) {
    if(req.body.access_token === process.env.ACCESS_TOKEN){
        registrations = []
        res.status(200).send("Registrations cleared")
        return sendClearEventToAll();
    }
    else{
        res.status(403).send;
    }

});

function sendOpenEventToAll() {
    clients.forEach(client => {
            client.response.write(`event: open-bingo\n`);
            client.response.write(`data: bingo opened\n\n`)
        }
    )
}

router.post('/open', function(req, res) {
    if(req.body.access_token === process.env.ACCESS_TOKEN){
        open = true;
        res.status(200).send("Opened registrations")
        return sendOpenEventToAll();
    }
    else{
        res.status(403).send;
    }

});

function sendCloseEventToAll() {
    clients.forEach(client => {
            client.response.write(`event: close-bingo\n`);
            client.response.write(`data: bingo closed\n\n`)
        }
    )
}

router.post('/close', function(req, res) {
    if(req.body.access_token === process.env.ACCESS_TOKEN){
        open = false;
        res.status(200).send("Closed registrations")
        return sendCloseEventToAll();
    }
    else{
        res.status(403).send;
    }

});

router.get('/status', (request, response) => response.json({clients: clients.length}));

function sendEventsToAll(newReg) {
    clients.forEach(client => {
        client.response.write(`event: message\n`);
        client.response.write(`data: ${JSON.stringify(newReg)}\n\n`)
    }
    )
}


module.exports = router;