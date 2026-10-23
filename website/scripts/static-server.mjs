import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve } from 'node:path'
import { pipeline } from 'node:stream'
import { fileURLToPath } from 'node:url'
import { createGzip } from 'node:zlib'

const root = resolve(import.meta.dirname, '../dist')
const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.xml': 'application/xml' }

export function createStaticServer() {
  return createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost')
    const relative = url.pathname.replace(/^\/fatigue-kit\/?/, '')
    let path = join(root, relative)
    if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html')
    if (!existsSync(path)) {
      response.writeHead(404)
      response.end('Not found')
      return
    }
    const extension = extname(path)
    response.setHeader('content-type', types[extension] ?? 'application/octet-stream')
    const compressible = ['.html', '.css', '.js', '.svg', '.json', '.xml'].includes(extension)
    if (compressible) response.setHeader('vary', 'Accept-Encoding')
    const gzipAccepted = String(request.headers['accept-encoding'] ?? '').split(',').some((entry) => {
      const [encoding, ...parameters] = entry.trim().split(';')
      return encoding === 'gzip' && !parameters.some((parameter) => /^q\s*=\s*0(?:\.0*)?$/.test(parameter.trim()))
    })
    const source = createReadStream(path)
    const done = (error) => { if (error) response.destroy(error) }
    if (compressible && gzipAccepted) {
      response.setHeader('content-encoding', 'gzip')
      pipeline(source, createGzip(), response, done)
    } else {
      pipeline(source, response, done)
    }
  })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createStaticServer().listen(4322, '127.0.0.1')
}
