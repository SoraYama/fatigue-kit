import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../dist')
const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml' }

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost')
  const relative = url.pathname.replace(/^\/fatigue-kit\/?/, '')
  let path = join(root, relative)
  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html')
  if (!existsSync(path)) {
    response.writeHead(404)
    response.end('Not found')
    return
  }
  response.setHeader('content-type', types[extname(path)] ?? 'application/octet-stream')
  createReadStream(path).pipe(response)
}).listen(4322, '127.0.0.1')
