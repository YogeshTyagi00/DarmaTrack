import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs'

const USE_S3 = !!(process.env.S3_BUCKET && process.env.S3_ENDPOINT)

const s3 = USE_S3
  ? new S3Client({
      region: process.env.S3_REGION ?? 'auto',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
      },
    })
  : null

export async function uploadImage(
  buffer: Buffer,
  mimetype: string,
  originalName: string,
): Promise<string> {
  const ext = path.extname(originalName) || '.jpg'
  const filename = `${randomUUID()}${ext}`

  if (USE_S3 && s3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: `uploads/${filename}`,
        Body: buffer,
        ContentType: mimetype,
      }),
    )
    // Return public URL
    const publicUrl = process.env.S3_PUBLIC_URL
    if (publicUrl) return `${publicUrl}/uploads/${filename}`
    // Fallback: construct URL from endpoint + bucket
    return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/uploads/${filename}`
  }

  // Local disk fallback
  const uploadsDir = path.join(process.cwd(), 'uploads')
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
  fs.writeFileSync(path.join(uploadsDir, filename), buffer)
  return `/uploads/${filename}`
}
