var http = require('http')
var httpProxy = require('http-proxy')

var proxy = httpProxy.createProxyServer()

proxy.on('proxyRes', function(proxyRes, req, res) {
    if (req.headers.origin) {
        const origin = req.headers.origin
        console.log(`\tadded Access-Control-Allow-Origin: ${origin}`)
        res.setHeader('Access-Control-Allow-Origin', origin)
    }
})

proxy.on('error', function(err, req, res) {
    console.log(err)
    res.writeHead(500)
    res.end('Proxy error: ' + err.code)
})

function corsProxy(router) {
    const server = http.createServer(function(req, res) {
        const maxAge = 60
        console.log(`${req.method} ${req.url}`)
        if (req.method === 'OPTIONS') {
            const origin = req.headers.origin
            const reqMethod = req.headers['access-control-request-method']
            const reqHeaders = req.headers['access-control-request-headers']
            res.setHeader('Access-Control-Allow-Origin', origin)
            console.log(`\tadded Access-Control-Allow-Origin: ${origin}`)
            res.setHeader('Access-Control-Allow-Methods', reqMethod)
            console.log(`\tadded Access-Control-Allow-Methods: ${reqMethod}`)
            if (reqHeaders !== undefined) {
                res.setHeader('Access-Control-Allow-Headers', reqHeaders)
                console.log(`\tadded Access-Control-Allow-Headers: ${reqHeaders}`)
            }
            res.setHeader('Access-Control-Max-Age', maxAge)
            console.log(`\tadded Access-Control-Max-Age: ${maxAge}`)
            res.end()
        } else {
            try {
                const target = router(req)
                console.log(`\trouted to ${target}`)
                proxy.web(req, res, { target: target })
            } catch (err) {
                console.log(err)
                res.writeHead(404)
                res.end('no route')
            }
        }
    })

    server.on('listening', () => {
        console.log('cors-proxy started ' + JSON.stringify(server.address()))
    })

    return server
}

module.exports = corsProxy