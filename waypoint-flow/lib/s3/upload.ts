import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;

/**
 * Generate a pre-signed URL so the client can upload directly to S3.
 * The Next.js API route calls this and returns the URL to the browser.
 * The browser then does a PUT request directly to S3 — no binary data
 * passes through the Next.js server.
 *
 * @param key  S3 object key, e.g. "deliveries/delivery-id/photo-1.jpg"
 * @param contentType  MIME type, e.g. "image/jpeg"
 * @param expiresIn  Seconds the URL is valid (default: 5 minutes)
 */
export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Returns the public URL of an S3 object.
 * Only works if the bucket/object is public.
 * For private objects, generate a signed GET URL instead.
 */
export function getPublicUrl(key: string): string {
  return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Generate a pre-signed GET URL to view a private S3 object.
 */
export async function getViewUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}
