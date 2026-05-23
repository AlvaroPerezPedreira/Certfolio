import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import {
  getPrivateCertCollectionPath,
  getPublicCertCollectionPath,
} from './firestorePaths'

function toPublicProjection(payload, publishedAtValue) {
  const projection = {
    title: payload.title,
    provider: payload.provider,
    providerSlug: payload.providerSlug,
    completedAt: payload.completedAt,
    updatedAt: serverTimestamp(),
    publishedAt: publishedAtValue,
  }

  if (payload.issuer) {
    projection.issuer = payload.issuer
  }

  if (payload.externalUrl) {
    projection.externalUrl = payload.externalUrl
  }

  return projection
}

export async function saveCert({ certId, payload, userId }) {
  const privateCollectionRef = collection(db, ...getPrivateCertCollectionPath(userId))
  const privateDocRef = certId
    ? doc(db, ...getPrivateCertCollectionPath(userId), certId)
    : doc(privateCollectionRef)
  const publicDocRef = doc(db, ...getPublicCertCollectionPath(), privateDocRef.id)
  const existingSnapshot = certId ? await getDoc(privateDocRef) : null
  const existingData = existingSnapshot?.exists() ? existingSnapshot.data() : null
  const batch = writeBatch(db)
  const publishedAtValue = payload.published
    ? existingData?.publishedAt ?? serverTimestamp()
    : null

  const privatePayload = {
    ...payload,
    updatedAt: serverTimestamp(),
    publishedAt: publishedAtValue,
  }

  if (existingSnapshot?.exists()) {
    batch.update(privateDocRef, privatePayload)
  } else {
    batch.set(privateDocRef, {
      ...privatePayload,
      createdAt: serverTimestamp(),
      ownerUid: userId,
    })
  }

  if (payload.published) {
    batch.set(publicDocRef, toPublicProjection(privatePayload, publishedAtValue))
  } else {
    batch.delete(publicDocRef)
  }

  await batch.commit()

  return privateDocRef.id
}

export async function deleteCert({ certId, userId }) {
  const privateDocRef = doc(db, ...getPrivateCertCollectionPath(userId), certId)
  const publicDocRef = doc(db, ...getPublicCertCollectionPath(), certId)
  const batch = writeBatch(db)

  batch.delete(privateDocRef)
  batch.delete(publicDocRef)

  await batch.commit()
}

export async function togglePublished({ cert, nextPublished, userId }) {
  const payload = {
    title: cert.title,
    provider: cert.provider,
    providerSlug: cert.providerSlug,
    completedAt: cert.completedAt,
    published: nextPublished,
  }

  if (cert.issuer) {
    payload.issuer = cert.issuer
  }

  if (cert.description) {
    payload.description = cert.description
  }

  if (cert.externalUrl) {
    payload.externalUrl = cert.externalUrl
  }

  return saveCert({ certId: cert.id, payload, userId })
}
