// *******************************************************************
// RESTful Blockchain service built with Express over the simplechain
// code from project 2
// *******************************************************************
// Debug logging
const debug = require('debug')('restservice');

// we use express to host our RESTful service calls
const express = require('express');
var bodyParser = require('body-parser');

// Import our custom blockchain library and singleton
var simplechain = require('./simplechain.js');
var blockchain = simplechain.blockchain;

// initialize express app
const app = express();

// *****************************************************************
// Handle errors
//
// Here we handle errors when searching for blocks by height.
// Since we do not have a height method, clients can simply use
// the 404 to indicate they have hit the end of the list.
// Alternatively, a height/ call could be added.
// *****************************************************************
function handle_err(err, res) {
  if (err.type === "NotFoundError") {
    res.status(404).send('Block not found');
  } else {
    console.log(err)
    res.status(501).send('Unknown error reading block');
  }
}

// **************************************************************
// Get Block
//
// This web method gets a block by its height.  If we get a
// NotFoundError, the error handler will convert it to
// a clean 404 return for us
// **************************************************************
async function get_block(req, res) {
  let blockheight = req.params.blockheight;
  debug('saw request for block at height: ' + blockheight);
  await blockchain.getBlock(blockheight).then((block) => res.send(block))
    .catch((err) => handle_err(err, res));
}

// *************************************************************
// Save a block to the end of the chain.
//
// This method expects a block that just has a body field.
// Other fields may be added, but the timestamp, height and
// hash data will be added by our service.  The post should
// use a content-type of application/json
// *************************************************************
async function post_block(req, res) {
  debug('saw post of new block: ' + req.body);
  let block = req.body;
  block = await blockchain.addBlock(block)
    .then(data => res.send(data))
    .catch((err) => res.status(501).send('Unknown error saving block'))
}

// Setup routing, including our statics for a sample Console web app
app.use(bodyParser.json());
app.use('/', express.static('static/'))
app.get('/block/:blockheight', get_block);
app.post('/block/', post_block);

// Fire it up on port 8000
app.listen(8000, () => console.log('listening on port 8000'));
