# cors-test-proxy

This is a reverse proxy for CI testing web apps against backend services.

**DO NOT USE IN PRODUCTION.** This disables the security provided by CORS.

## Use cases

You would like to do development OR continuous integration testing against backend services on localhost.

CORS is causing issues because the webserver and backend endpoints are not running on the same port.

Your backend services aren't configured to understand CORS because it's handled in production by an API gateway.

While CORS can be disabled in the browser, this may be difficult or infeasible in the CI environment. This is where cors-test-proxy comes in. It's a reverse proxy for backend APIs that spoofs the required CORS responses (including preflight requests).

## Usage

The `cors-test-proxy` module exports a factory function for creating a [proxy server](https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_class_http_server). The factory function takes a *router* function as an argument. The router is provided a [`request`](https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_class_http_incomingmessage) object and should return a host to proxy the request to.

### Simple example

Forward all requests to `localhost:4567`. The proxy listens on port 8001.

```javascript
var createProxy = require('cors-test-proxy')

createProxy(() => 'http://localhost:4567').listen(8001)
```

### More complex example

Foward requests to one of three services depending on the prefix of the request path. In this example the three services are running on the same port, but different Docker containers. The proxy is also running in Docker.

```javascript
var createProxy = require('cors-test-proxy')

const waldorf = 'http://waldorf:4567'
const yolanda = 'http://yolanda:4567'
const janice  = 'http://janice:4567'


const routes = {
    '/v1/ruleset':               waldorf,
    '/v1/project':               yolanda,
    '/v1/sessions':              janice,
    '/v1/users':                 janice,
    '/v1/accounts':              janice,
}

function router(req) {
    const match = Object.keys(routes).filter(k => req.url.startsWith(k))
    if (match.length < 1)
        throw new Error(`no route for ${req.url}`)
    return routes[match[0]]
}

createProxy(router).listen(8001)
```
