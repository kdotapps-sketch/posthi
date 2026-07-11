import 'server-only'
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey() {
  const secret = process.env.POSTHI_ENCRYPTION_KEY
  if (!secret) {
    throw new Error('POSTHI_ENCRYPTION_KEY is not set')
  }
  // Ensure the key is exactly 32 bytes
  return crypto.createHash('sha256').update(String(secret)).digest()
}

export function encryptToken(text: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag().toString('hex')
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decryptToken(encryptedText: string): string {
  const key = getKey()
  
  const [ivHex, authTagHex, encryptedData] = encryptedText.split(':')
  if (!ivHex || !authTagHex || !encryptedData) {
    throw new Error('Invalid encrypted text format')
  }

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
