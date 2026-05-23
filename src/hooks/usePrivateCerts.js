import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../firebase'
import { getPrivateCertCollectionPath } from '../lib/firestorePaths'
import { sortCertsByCompletedAt } from '../utils/certDisplay'

export function usePrivateCerts(userId, isEnabled = true) {
  const [state, setState] = useState({
    key: '',
    certs: [],
    error: '',
  })

  useEffect(() => {
    if (!isEnabled || !userId) {
      return undefined
    }

    const certCollection = collection(db, ...getPrivateCertCollectionPath(userId))

    const unsubscribe = onSnapshot(
      certCollection,
      (snapshot) => {
        const nextCerts = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }))

        setState({
          key: userId,
          certs: sortCertsByCompletedAt(nextCerts),
          error: '',
        })
      },
      (nextError) => {
        setState({
          key: userId,
          certs: [],
          error: nextError.message ?? 'Unable to load private certifications.',
        })
      },
    )

    return unsubscribe
  }, [isEnabled, userId])

  if (!isEnabled || !userId) {
    return { certs: [], isLoading: false, error: '' }
  }

  if (state.key !== userId) {
    return { certs: [], isLoading: true, error: '' }
  }

  return { certs: state.certs, isLoading: false, error: state.error }
}