import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

const [, , fromUid, toUid] = process.argv

if (!fromUid || !toUid) {
  console.error('Usage: node scripts/migrate-owner-certs.mjs <fromUid> <toUid>')
  process.exit(1)
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a Firebase service account JSON file path.')
  process.exit(1)
}

if (!getApps().length) {
  initializeApp({
    credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  })
}

const db = getFirestore()
const projectNamespace = 'certfolio'
const fromCertsPath = `users/${fromUid}/projects/${projectNamespace}/certs`
const toCertsPath = `users/${toUid}/projects/${projectNamespace}/certs`

const fromSnapshot = await db.collection(fromCertsPath).get()

if (fromSnapshot.empty) {
  console.log(`No certs found at ${fromCertsPath}`)
  process.exit(0)
}

let batch = db.batch()
let operationCount = 0
let copiedCount = 0

async function commitIfNeeded(force = false) {
  if (operationCount === 0 || (!force && operationCount < 450)) {
    return
  }

  await batch.commit()
  batch = db.batch()
  operationCount = 0
}

for (const docSnapshot of fromSnapshot.docs) {
  const targetRef = db.collection(toCertsPath).doc(docSnapshot.id)
  const data = docSnapshot.data()

  batch.set(targetRef, {
    ...data,
    ownerUid: toUid,
    migratedAt: FieldValue.serverTimestamp(),
    migratedFromOwnerUid: fromUid,
  })

  operationCount += 1
  copiedCount += 1
  await commitIfNeeded()
}

await commitIfNeeded(true)

console.log(`Copied ${copiedCount} certs from ${fromCertsPath} to ${toCertsPath}`)
console.log('Public projection was not changed. Already-published certs keep their existing public document IDs.')
