// *******************************************************************
// RESTful Blockchain star "digital asset" service built with Express
// over the simplechain code from project 3
// *******************************************************************
// Debug logging
const debug = require('debug')('restservice');

// bitcoin client RPC library for sig validation
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

// we use express to host our RESTful service calls
const express = require('express');
var bodyParser = require('body-parser');

// Import our custom blockchain library and singleton
var simplechain = require('./simplechain.js');
var blockchain = simplechain.blockchain;

var pendingRequests = {};

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

// **************************************************************
// Get Blocks By Address
//
// This web method gets a block by the owner address.
// **************************************************************
async function get_blocks_by_address(req, res) {
  let address = req.params.address;
  let retval = [];
  let error = false;
  let done = false;
  for (var i=0; done==false; i++) {
    await blockchain.getBlock(i)
    .then((block) => {
      console.log(block);
      if (block.address === address) {
        retval.push(block);
      }
    })
    .catch((err) => {
      if (err.type === "NotFoundError") {
        done = true;
      } else {
        console.log(err);
        res.status(501).send('Unknown error reading blocks');
        error = true;
        done = true;
        return;
      }
    });
  }
  if (! error) {
    res.status(200).send(retval);
  }
}

// **************************************************************
// Get Block By Hash
//
// This web method gets a block by its hash.
// **************************************************************
async function get_block_by_hash(req, res) {
  let hash = req.params.hash;
  let done = false;
  for (var i=0; done==false; i++) {
    await blockchain.getBlock(i)
    .then((block) => {
      console.log(block);
      if (block.hash === hash) {
        debug('saw matching hash, sending block');
        res.status(200).send(block);
        done = true;
        return;
      }
    })
    .catch((err) => {
      if (err.type === "NotFoundError") {
        res.status(404);
        done = true;
      } else {
        console.log(err);
        res.status(501).send('Unknown error reading blocks');
        done = true;
      }
    });
  }
  if (! done) {
    res.status(501);
  }
}


// *************************************************************
// Save a block to the end of the chain.
//
// This method expects a block that has a body field.
// Other fields may be added, but the timestamp, height and
// hash data will be added by our service.  The post should
// use a content-type of application/json.
//
// The body field should be json data with the following
// fields in it:
//
// address - the address of the submitter (with matching signature)
// star - the name of the star being registered
// ra - the ra position of the star being registered
// dec - the dec position of the star being registered
// story (optional) - a comment about how this star was selected
//
// The server will verify that the specified address has been
// recently authorized to post data.  Once the star is accepted,
// this authorization state will be removed.  The caller will
// need to reauthorize with the signed message handshake prior
// to submitting their next star.
// *************************************************************
async function post_block(req, res) {
  debug('saw post of new block: ' + req.body);
  let block = req.body;
  if (!'address'  in block) {
    res.status(400).send('address is a required field');
  }
  if (!'star'  in block) {
    res.status(400).send('star is a required field');
  }
  if (!'ra'  in block.star) {
    res.status(400).send('ra is missing in star');
  }
  if (!'dec'  in block.star) {
    res.status(400).send('dec is missing in star');
  }
  let pendingRequest = pendingRequests[block.address];
  if (pendingRequest == undefined) {
    res.status(401).send('No pending request for address ' + block.address);
  }
  if (pendingRequest.validated != true) {
    res.status(401).send('Request not yet validated by signed response from client');
  }
  let now = parseInt(new Date().getTime().toString().slice(0,-3))
  if (now > parseInt(pendingRequest.requestTimestamp) + parseInt(pendingRequest.validationWindow)) {
      res.status(401).send('Window of authorization expired');
  } else {
    let address = block.address;
    block = await blockchain.addBlock(block)
      .then(data => res.status(201).send(data))
      .catch((err) => res.status(501).send('Unknown error saving block'))
    // Now we are done with this request
    delete pendingRequests[address];
  }
}

// *************************************************************
// Request validation.
//
// This method starts a handshake process required before an
// address is allowed to submit a star.  This step tracks
// a session indexed by the given address and supplies a
// message field that must be signed by the corresponding private
// key.
//
// The request body should be a json object with the following
// fields
//
// address - the address of the submitter
// *************************************************************
async function request_validation(req, res) {
  debug('saw request validation: ' + req.body);
  let validationData = req.body;
  validationData.requestTimestamp = new Date().getTime().toString().slice(0,-3);
  validationData.validationWindow = 300;
  validationData.message = validationData.address + ':'
    + validationData.requestTimestamp + ':starRegistry';
  validationData.validated = false;
  pendingRequests[validationData.address] = validationData;
  res.send(validationData);
}


// *************************************************************
// Validate signature.
//
// This method finishes the handshake process required before an
// address is allowed to submit a star.  This step pulls the
// session info back out for the given address.  Then it
// verifies the challenge message against the signature sent.
// If the signature is valid, the session is set as validated.
//
// The request body should be a json object with the following
// fields
//
// address - the address of the submitter
// signature - the signature of the challenge message
// *************************************************************
async function message_signature_validate(req, res) {
  debug('saw message signature validation call: ' + req.body);
  let signatureData = req.body;
  let pendingRequest = pendingRequests[signatureData.address];
  let address = signatureData.address;
  let signature = signatureData.signature;
  let message = pendingRequest.message;
  if (bitcoinMessage.verify(message, address, new Buffer(signature, 'base64'))) {
      debug('signature validated, continuing');
      let retval = {};
      retval.registerStar = true;
      retval.status = signatureData;
      let currentTime = new Date().getTime().toString().slice(0,-3);
      if ((currentTime - pendingRequest.requestTimestamp)
          > pendingRequest.requestTimestamp) {
            res.status(401).send('Time window expired');
      }
      debug('pending request timestamp: ' + pendingRequest.requestTimestamp);
      debug('pending request window: ' + pendingRequest.validationWindow);
      debug('current time: ' + currentTime);
      retval.status.validationWindow = parseInt(pendingRequest.requestTimestamp) +
        parseInt(pendingRequest.validationWindow) - currentTime;
      debug('returning validation window: ' + retval.status.validationWindow);
      retval.status.messageSignature = "valid";
      pendingRequest.validated = true;
      res.status(201).send(retval);
  } else {
      res.status(401).send('Invalid signature');
  }
}


// *************************************************************
// Sign message.
//
// This method should not normally be used and is just a helper
// for the testing console.  You can post to this endpoint to
// sign a message with a private key.
//
// The request body should be a json object with the following
// fields
//
// privateKey - the private key to sign with
// message - the challenge message to sign
// *************************************************************
async function sign_message(req, res) {
  debug('saw sign_message helper call');
  let signingData = req.body;
  let privateKeyWIF = signingData.privateKey;
  let keyPair = bitcoin.ECPair.fromWIF(privateKeyWIF);
  let privateKey = keyPair.privateKey;
  let message = signingData.message;
  let signature = bitcoinMessage.sign(message, privateKey);
  res.status(200).send(signature.toString('base64'));
}

// Setup routing, including our statics for a sample Console web app
app.use(bodyParser.json());
app.use('/', express.static('static/'))
app.get('/block/:blockheight', get_block);
app.post('/block/', post_block);
app.get('/stars/address\::address', get_blocks_by_address);
app.get('/stars/hash\::hash', get_block_by_hash);
app.post('/requestValidation/', request_validation);
app.post('/message-signature/validate/', message_signature_validate);
app.post('/message-signature/sign/', sign_message);

// Fire it up on port 8000
app.listen(8000, () => console.log('listening on port 8000'));
