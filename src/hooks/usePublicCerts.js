import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../firebase'
import { getPublicCertCollectionPath } from '../lib/firestorePaths'
import { sortCertsByCompletedAt } from '../utils/certDisplay'

function toPublicReadErrorMessage(error) {
  if (error?.code === 'permission-denied') {
    return 'Public certifications are blocked by Firestore rules. Deploy firestore.rules so publicProfiles can be read without authentication.'
  }

  return error?.message ?? 'Unable to load published certifications.'
}

export function usePublicCerts() {
  const [certs, setCerts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const certCollection = collection(db, ...getPublicCertCollectionPath())

    const unsubscribe = onSnapshot(
      certCollection,
      (snapshot) => {
        const nextCerts = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }))

        setCerts(sortCertsByCompletedAt(nextCerts))
        setError('')
        setIsLoading(false)
      },
      (nextError) => {
        setError(toPublicReadErrorMessage(nextError))
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  return { certs, isLoading, error }
}