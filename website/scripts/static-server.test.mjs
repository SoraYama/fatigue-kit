import assert from 'node:assert/strict'
import { get } from 'node:http'
import { after, before, test } from 'node:test'
import { gunzipSync } from 'node:zlib'
import { createStaticServer } from './static-server.mjs'

const server = createStaticServer()
before(() => new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)))
after(() => new Promise((resolve) => server.close(resolve)))

function request(path, encoding) {
  return new Promise((resolve, reject) => {
    get({ hostname: '127.0.0.1', port: server.address().port, path, headers: { 'Accept-Encoding': encoding } }, (response) => {
      const chunks = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => resolve({ headers: response.headers, body: Buffer.concat(chunks) }))
    }).on('error', reject)
  })
}

test('negotiates gzip for text and preserves its exact decoded body', async () => {
  const plain = await request('/fatigue-kit/', 'identity')
  const compressed = await request('/fatigue-kit/', 'gzip')
  assert.equal(compressed.headers['content-encoding'], 'gzip')
  assert.equal(compressed.headers.vary, 'Accept-Encoding')
  assert.deepEqual(gunzipSync(compressed.body), plain.body)
  assert.ok(compressed.body.length < plain.body.length)
})

test('honors disabled gzip and serves PNG with its image type', async () => {
  const plain = await request('/fatigue-kit/', 'gzip;q=0, identity')
  assert.equal(plain.headers['content-encoding'], undefined)
  const png = await request('/fatigue-kit/social-preview.png', 'gzip')
  assert.equal(png.headers['content-type'], 'image/png')
  assert.equal(png.headers['content-encoding'], undefined)
})
