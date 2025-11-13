import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class FileUploadService implements OnModuleInit {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly s3Client: S3Client;
  private readonly signingClient: S3Client;
  private readonly bucketName: string;

  constructor() {
    const minioHost = process.env.MINIO_HOST || 'localhost';
    const minioPort = process.env.MINIO_PORT || '9000';
    const endpoint = `http://${minioHost}:${minioPort}`;
    const accessKeyId = process.env.MINIO_ACCESS_KEY || 'minioadmin';
    const secretAccessKey = process.env.MINIO_SECRET_KEY || 'minioadmin';

    this.bucketName = process.env.MINIO_BUCKET || 'kpt-files';

    const baseClientConfig = {
      region: 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    } as const;

    this.s3Client = new S3Client({
      endpoint,
      ...baseClientConfig,
    });

    let signingEndpoint = endpoint;
    const publicEndpointEnv = process.env.MINIO_PUBLIC_ENDPOINT;
    if (publicEndpointEnv) {
      try {
        const parsed = new URL(publicEndpointEnv);
        signingEndpoint = parsed.origin;
      } catch (error) {
        this.logger.warn(`Invalid MINIO_PUBLIC_ENDPOINT provided: ${publicEndpointEnv}`);
      }
    }

    if (signingEndpoint === endpoint) {
      this.signingClient = this.s3Client;
    } else {
      this.signingClient = new S3Client({
        endpoint: signingEndpoint,
        ...baseClientConfig,
      });
    }

    this.logger.log('FileUploadService initialized');
  }

  /**
   * Initialize bucket on module init
   */
  async onModuleInit() {
    await this.ensureBucketExists();
  }

  /**
   * Check if bucket exists and create it if not
   */
  private async ensureBucketExists(): Promise<void> {
    try {
      // Check if bucket exists
      const headCommand = new HeadBucketCommand({
        Bucket: this.bucketName,
      });

      try {
        await this.s3Client.send(headCommand);
        this.logger.log(`Bucket "${this.bucketName}" already exists`);
      } catch (error: any) {
        // If bucket doesn't exist (404), create it
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          this.logger.log(`Bucket "${this.bucketName}" not found, creating...`);
          
          const createCommand = new CreateBucketCommand({
            Bucket: this.bucketName,
          });

          await this.s3Client.send(createCommand);
          this.logger.log(`Bucket "${this.bucketName}" created successfully`);
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.logger.error(`Failed to ensure bucket exists: ${this.bucketName}`, error);
      // Don't throw - let the service continue, bucket will be created on first upload if needed
    }
  }

  /**
   * Upload file to S3/MinIO
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'files',
  ): Promise<{ url: string; key: string }> {
    try {
      const fileName = `${Date.now()}-${file.originalname}`;
      const key = `${folder}/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      this.logger.log(`File uploaded successfully: ${key}`);

      // Generate signed URL
      const url = await this.getFileUrl(key);

      return { url, key };
    } catch (error) {
      this.logger.error('Failed to upload file:', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  /**
   * Get signed URL for file access
   */
  async getFileUrl(key: string, expiresIn: number = 604800): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.signingClient, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate URL for file: ${key}`, error);
      throw new BadRequestException('Failed to generate file URL');
    }
  }

  /**
   * Delete file from S3/MinIO
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${key}`, error);
      throw new BadRequestException('Failed to delete file');
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }
}

