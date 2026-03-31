import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const USE_S3 = !!(process.env.S3_BUCKET && process.env.S3_ENDPOINT)
console.log(`[Storage] Mode: ${USE_S3 ? 'S3/Supabase' : 'local disk'}, bucket: ${process.env.S3_BUCKET ?? 'N/A'}`)

// Upload via raw HTTP PUT (avoids AWS SDK SSL issues on Windows)
async function uploadToS3(buffer: Buffer, key: string, mimetype: string): Promise<void> {
  const endpoint = process.env.S3_ENDPOINT!
  const bucket = process.env.S3_BUCKET!
  const accessKeyId = process.env.S3_ACCESS_KEY_ID!
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY!
  const region = process.env.S3_REGION ?? 'auto'

  // Use AWS SDK but with SSL verification disabled via env var
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
  const client = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  }))

  // Re-enable after upload
  delete process.env.NODE_TLS_REJECT_UNAUTHORIZED
}

export async function uploadImage(
  buffer: Buffer,
  mimetype: string,
  originalName: string,
): Promise<string> {
  const ext = path.extname(originalName) || '.jpg'
  const filename = `${randomUUID()}${ext}`

  if (USE_S3) {
    try {
      const key = filename  // store directly in bucket root, no subfolder
      await uploadToS3(buffer, key, mimetype)
      const publicUrl = process.env.S3_PUBLIC_URL
      const url = publicUrl
        ? `${publicUrl}/${filename}`
        : `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`
      console.log(`[S3] Uploaded to: ${url}`)
      return url
    } catch (err) {
      console.error('[S3] Upload failed, falling back to local disk:', err)
    }
  }

  // Local disk fallback
  const uploadsDir = path.join(process.cwd(), 'uploads')
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
  fs.writeFileSync(path.join(uploadsDir, filename), buffer)
  return `/uploads/${filename}`
}
