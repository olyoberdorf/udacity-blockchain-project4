# Blockchain Project 4

This is my implementation of the Project 4 for Blockchain.  It enhances the
RESTful webservice from Project 3 with tracking for digital assets.  
With this project, users register for "ownership" of stars via their
coordinates.

### Prerequisites

This webservice depends on `level`, `crypto-js`, `express`,  `debug`,
`bitcoinjs-lib`, `bitcoinjs-message`, and `body-parser`.

There is also a web front-end that relies on jquery and bootstrap but pulls
them in via CDN.  Alternatively, one can simply test the web methods directly
with `curl` or `postman`.

### Installation

```
npm install
```

## Endpoints

### requestValidation

The `requestValidation` endpoint is used to start a request with the server.
This generates a challenge message that the caller must follow up with a
signature.  This endpoint also begins a 5 minute timer and the full
registration workflow must complete within that time.  Only one request can
be active at a time for a given address.

### validate

The `validate` endpoint is used to prove the caller controls the address given
earlier.  The proof is offered by signing the message sent back from the
previous call.

### block (POST)

Finally, the caller is able to do a POST to the `block` endpoint to add an
entry on the chain.  This call expects a JSON object with the callers
address, `ra` and `dec` for the star and optionally a `story` field describing the
source of the coordinate information.

Example payload:

```JSON
{
    "address":"1HZwkjkeaoZfTSaJxDw6aKkxp45agDiEzN",
    "star": {
        "ra":" 05 55 10.30536  ",
        "dec":"+07 24 25.4304 ",
        "story":"Found via Simbad restful query"
    }
}
```

### stars/hash:[HASH]

A GET call to this endpoint extracts the requested hash value and finds the
matching block.

### stars/address:[ADDRESS]

A GET call to this endpoint parses the address and returns all blocks that
were registered to it.

### block/[HEIGHT]

A GET call to this endpoint returns the block at that blockheight index in the
chain.

## Testing

To test code:
 1. Open a command prompt or shell terminal
 2. Remove the `chaindata` folder, if present (optional)
 3. Run `node index.js` (or `npm test` will do the same thing)
 4. Browse to `http://localhost:8000` to see the debug console for the service.

The debug web app walks through the REST API's workflow one step at a time.
It also includes helper forms for signing a message with your private key
and for looking up star coordinates by name.  The star lookup makes use of the
Simbad webservice hosted by Strasburg (http://cdsweb.u-strasbg.fr/).
