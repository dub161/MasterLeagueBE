
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, getBucketConfig } from "./aws-config";

const s3Client = createS3Client();

export async function uploadFile(buffer: Buffer, fileName: string): Promise<string> {
  const { bucketName, folderPrefix } = getBucketConfig();
  
  if (!bucketName) {
    throw new Error("AWS_BUCKET_NAME is not configured");
  }

  const key = `${folderPrefix}team-logos/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: getContentType(fileName),
  });

  await s3Client.send(command);
  return key;
}

export async function downloadFile(key: string): Promise<string> {
  const { bucketName } = getBucketConfig();
  
  if (!bucketName) {
    throw new Error("AWS_BUCKET_NAME is not configured");
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  // Generate a signed URL that expires in 1 hour
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return signedUrl;
}

export async function downloadFileAsBuffer(key: string): Promise<Buffer> {
  const { bucketName } = getBucketConfig();
  
  if (!bucketName) {
    throw new Error("AWS_BUCKET_NAME is not configured");
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await s3Client.send(command);
  
  if (!response.Body) {
    throw new Error("File body is empty");
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  const stream = response.Body as any;
  
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}

export async function deleteFile(key: string): Promise<void> {
  const { bucketName } = getBucketConfig();
  
  if (!bucketName) {
    throw new Error("AWS_BUCKET_NAME is not configured");
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

function getContentType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  const contentTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
  };
  return contentTypes[ext || 'jpg'] || 'application/octet-stream';
}
