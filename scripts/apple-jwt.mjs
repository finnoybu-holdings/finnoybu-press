// One-off script to generate the Apple "client secret" JWT for Sign in
// with Apple. Used once when configuring Supabase's Apple provider in
// the older UI that wants a single Secret Key string. The JWT is valid
// for up to 6 months (Apple's hard cap); regenerate before it expires.
//
// Run: node scripts/apple-jwt.mjs

import crypto from 'node:crypto'
import fs from 'node:fs'

const TEAM_ID = '25HQJ5M9V7'
const KEY_ID = 'NJA2ZA76N3'
const SERVICES_ID = 'org.finnoybu.press.web'
const P8_PATH = 'D:/Users/Finnoybu/Downloads/AuthKey_NJA2ZA76N3.p8'

const SIX_MONTHS_SECONDS = 15777000 // Apple max

const now = Math.floor(Date.now() / 1000)

const header = { alg: 'ES256', kid: KEY_ID }
const payload = {
  iss: TEAM_ID,
  iat: now,
  exp: now + SIX_MONTHS_SECONDS,
  aud: 'https://appleid.apple.com',
  sub: SERVICES_ID,
}

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

const headerB64 = b64url(JSON.stringify(header))
const payloadB64 = b64url(JSON.stringify(payload))
const signingInput = `${headerB64}.${payloadB64}`

const p8 = fs.readFileSync(P8_PATH, 'utf8')
const privateKey = crypto.createPrivateKey(p8)

// JWT ES256 expects the raw r||s 64-byte format (IEEE P-1363), not the
// DER-wrapped output Node's crypto.sign produces by default.
const rawSig = crypto.sign('SHA256', Buffer.from(signingInput), {
  key: privateKey,
  dsaEncoding: 'ieee-p1363',
})

const jwt = `${signingInput}.${b64url(rawSig)}`

const expiry = new Date((now + SIX_MONTHS_SECONDS) * 1000)
console.log('Apple Sign In — Client Secret JWT')
console.log('---------------------------------')
console.log('Issued:', new Date(now * 1000).toISOString())
console.log('Expires:', expiry.toISOString(), '<<-- regenerate before this date')
console.log()
console.log('JWT (paste into Supabase → Authentication → Providers → Apple → Secret Key):')
console.log()
console.log(jwt)
