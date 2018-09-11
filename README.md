# Blockchain Project 4

This is my implementation of the Project 4 for Blockchain.  It enhances the
RESTful webservice from Project 3 with tracking for digital assets.  
With this project, users register for "ownership" of stars via their
coordinates.

### Prerequisites

This webservice depends on `level`, `crypto-js`, `express` and `debug`.

There is also a web front-end that relies on jquery and bootstrap but pulls
then in via CDN.  Alternatively, one can simply test the web methods directly
with `curl` or `postman`.

### Installation

```
npm install
```

## Notes

## Testing

To test code:
 1. Open a command prompt or shell terminal
 2. Remove the `chaindata` folder, if present (optional)
 3. Run `node index.js` (or `npm test` will do the same thing)
 4. Browse to `http://localhost:8000` to see the debug console for the service.

The debug web app will load the entire chain into an html table for viewing.
It also provides a form that exercises the POST and then reloads the page.
It's not fully AJAX, but demonstrates the web app functionality.
