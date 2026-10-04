/**
 * S3 Upload Helper
 * Hackathon mode: if AWS credentials are not configured,
 * returns the base64 data URL directly (stored in Firestore).
 * Production: would upload to S3 and return a public URL.
 */
export async function uploadToS3(
  base64OrBuffer: string | Buffer,
  key: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const hasCredentials =
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_ACCESS_KEY_ID !== 'your-access-key-id' &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_SECRET_ACCESS_KEY !== 'your-secret-access-key';

  if (!hasCredentials) {
    // Fallback: return base64 data URL directly
    if (typeof base64OrBuffer === 'string') {
      if (base64OrBuffer.startsWith('data:')) return base64OrBuffer;
      return `data:${contentType};base64,${base64OrBuffer}`;
    }
    return `data:${contentType};base64,${base64OrBuffer.toString('base64')}`;
  }

  // Real S3 upload (only runs when credentials are set)
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

  const client = new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET || 'waypoint-flow-photos',
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: 3600 });
}
