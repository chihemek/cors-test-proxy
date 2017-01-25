# cors-test-proxy

This is a reverse proxy for integration testing web apps against backend services.

**DO NOT USE IN PRODUCTION.** This bypasses the CORS security mechanism.

## Use case

* You need to do selenium testing against backend API services running on localhost (not staging or prod).
* The browser's same-origin policy is blocking AJAX calls because the webserver and backend endpoints are not running on the same port.
* Disabling CORS in the browser is infeasible in your environment.

`cors-test-proxy` solves this by disabling CORS on the backend. It's a reverse proxy for backend APIs that spoofs the required CORS responses (including preflight requests). You don't need to modify your services to handle special CORS responses for testing.

## Usage

The `cors-test-proxy` module exports a factory function for creating a [proxy server](https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_class_http_server). The factory function takes a *router* function as an argument. The router is provided a [`request`](https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_class_http_incomingmessage) object and should return a host to proxy the request to.

### Simple example

Suppose you have a single API service running on port 4567. This forwards all requests to `localhost:4567`. The proxy listens on port 8001.

```javascript
var createProxy = require('cors-test-proxy')

createProxy(() => 'http://localhost:4567').listen(8001)
```

### More complex example

```
          +--------------------+           8080
          | webpack dev server |<---------------+
          +--------------------+                |
docker-compose                                  |
..........................................      |   +---------+
.   +---------+ 4567                     .      +---| browser |
.   | waldorf |<---+                     .      |   +---------+
.   +---------+    |                     .      |
.                  |    +---------+      .      |
.   +---------+ 4567    |  cors   |      . 8001 |
.   | yolanda |<---+----|  test   |<------------+
.   +---------+    |    |  proxy  |      .
.                  |    +---------+      .
.   +---------+ 4567                     .
.   | janice  |<---+                     .
.   +---------+                          .
..........................................
```

In this example, we are testing against a cluster of microservices. By adding additional routing logic, `cors-test-proxy` can direct requests to more than one server. This mimics an API gateway that would be used in production.

`cors-test-proxy` can also be built into a Docker container, as shown below.

`proxy.js`:
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

`package.json`:
```json
{
  "name": "ion-cors-proxy",
  "version": "0.1.0",
  "dependencies": {
    "cors-test-proxy": "^0.1.0"
  }
}
```

`Dockerfile`:
```dockerfile
FROM alpine:3.4

RUN apk add --no-cache nodejs

COPY . /usr/app

WORKDIR /usr/app

RUN npm install

CMD ["node", "proxy.js"]

EXPOSE 8001
```