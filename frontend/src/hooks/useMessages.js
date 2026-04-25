import { useState, useCallback } from 'react'
import api from '../api/client'

export function useMessages() {
  const [inbox,   setInbox]   = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const fetchInbox = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/messages/inbox')
      setInbox(data)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to load inbox')
    } finally {
      setLoading(false)
    }
  }, [])

  const sendMessage = useCallback(async (recipientDid, plaintext) => {
    const bytes          = new TextEncoder().encode(plaintext)
    const ciphertext_b64 = btoa(String.fromCharCode(...bytes))
    const nonce_b64      = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))))
    await api.post('/messages/send', { recipient_did: recipientDid, ciphertext_b64, nonce_b64 })
  }, [])

  return { inbox, loading, error, fetchInbox, sendMessage }
}
