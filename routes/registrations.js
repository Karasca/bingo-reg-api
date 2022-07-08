const express = require('express');
const router = express.Router();

let registrations = [
    {stream: "naro", open: false, seeds: []},
    {stream: "karasca", open: false, seeds: []}
];

let clients = [];

// The event stream endpoint
router.get('/', function(req, res) {
    let streamer = req.query.stream
    if(streamer !== undefined || null){
        const headers= {
            'Cache-Control': 'no-cache',
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive'
        }

        res.writeHead(200, headers);

        // get registration array for streamer
        let reg = findReg(streamer)

        // write whole registration array to listener
        res.write(`event: message\n`);
        res.write(`data: ${JSON.stringify(reg.seeds)}\n\n`);

        // write bingo status to listener
        if(reg.open){
            res.write(`event: open-bingo\n`)
            res.write(`data: bingo opened\n\n`)
        }else{
            res.write(`event: close-bingo\n`)
            res.write(`data: bingo closed\n\n`)
        }

        const clientId = Date.now();

        const newClient = {
            id: clientId,
            response: res,
            stream: streamer
        }

        console.log(newClient.stream)

        clients.push(newClient);

        req.on('close', () => {
            console.log(`${clientId} Connection closed`);
            clients = clients.filter(client => client.id !== clientId);
        });
    }else{
        res.status(400).send("no streamer provided in query: 'stream'")
    }
});

// save registration and send to all connections
router.post('/', function (req, res) {
    if(req.body.access_token === process.env.ACCESS_TOKEN){
        console.log(req.body.username)

        let streamerReg = findReg(req.body.streamer)

        if(!streamerReg.seeds.find(e => e.username === req.body.username)){
            const newReg = {
                username: req.body.username,
                seed: req.body.seed,
            }

            streamerReg.seeds.push(newReg);

            res.json(streamerReg.seeds)
            return sendEventsToAll(req.body.streamer,  streamerReg.seeds);
        }else{
            res.status(400).send("username already registered")
        }
    }
    else{
        res.status(403).send("Bad access token");
    }
});

// send every connected client the clear event
function sendClearEventToAll(streamer) {
    clients.forEach(client => {
        if(client.stream === streamer) {
            client.response.write(`event: clear\n`);
            client.response.write(`data: registrations cleared\n\n`)
        }
    })
}

// Finds the record relating to the streamer
function findReg(streamer) {
    return registrations.find(r => streamer.toLowerCase() === r.stream);
}

//clear post
router.post('/clear', function(req, res) {
    if(req.body.access_token === process.env.ACCESS_TOKEN){
        let reg = findReg(process.body.streamer)
        reg.seeds = []
        res.status(200).send("Registrations cleared")
        return sendClearEventToAll(process.body.streamer);
    }
    else{
        res.status(403).send("Bad access token");
    }

});

//sends open event to all
function sendOpenEventToAll(streamer) {
    clients.forEach(client => {
        if(client.stream === streamer) {
            client.response.write(`event: open-bingo\n`);
            client.response.write(`data: bingo opened\n\n`)
        }
    })
}

//open registration POST
router.post('/open', function(req, res) {
    if(req.body.access_token === process.env.ACCESS_TOKEN){

        let reg = findReg(req.body.streamer)
        reg.open = true

        res.status(200).send("Opened registrations")
        return sendOpenEventToAll(req.body.streamer);
    }
    else{
        res.status(403).send("Bad access token");
    }

});

//send close event to all connected clients
function sendCloseEventToAll(streamer) {
    clients.forEach(client => {
            if(client.stream === streamer){
                client.response.write(`event: close-bingo\n`);
                client.response.write(`data: bingo closed\n\n`)
            }
        }
    )
}

router.post('/close', function(req, res) {
    if(req.body.access_token === process.env.ACCESS_TOKEN){
        let reg = findReg(req.body.streamer)
        reg.open = false

        res.status(200).send("Closed registrations")
        return sendCloseEventToAll(req.body.streamer);
    }
    else{
        res.status(403).send("Bad access token");
    }

});

router.get('/status', (request, response) => response.json({clients: clients.length}));

function sendEventsToAll(streamer, seeds) {
        clients.forEach(client => {
            // send to clients only if related to streamer
            if(client.stream === streamer) {
                client.response.write(`event: message\n`);
                console.log(`${streamer} ${JSON.stringify(seeds)}`)
                client.response.write(`data: ${JSON.stringify(seeds)}\n\n`)
            }
        }
    )
}

module.exports = router;