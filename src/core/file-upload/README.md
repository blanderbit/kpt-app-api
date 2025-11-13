# File Upload Module

This module provides file upload functionality using MinIO (S3-compatible storage).

## Features

- Upload files to MinIO
- Generate signed URLs for file access
- Delete files from storage
- Check file existence

## Usage

### Import the module

```typescript
import { FileUploadModule } from './core/file-upload';

@Module({
  imports: [FileUploadModule],
})
export class YourModule {}
```

### Use the service

```typescript
import { FileUploadService } from './core/file-upload';

constructor(private readonly fileUploadService: FileUploadService) {}

async uploadFile(file: Express.Multer.File) {
  const result = await this.fileUploadService.uploadFile(file);
  // result.url - signed URL for accessing the file
  // result.key - file key in storage
}
```

## Configuration

Set the following environment variables:

- `MINIO_ENDPOINT` - MinIO endpoint (default: http://localhost:9000)
- `MINIO_ACCESS_KEY` - MinIO access key (default: minioadmin)
- `MINIO_SECRET_KEY` - MinIO secret key (default: minioadmin)
- `MINIO_BUCKET` - Bucket name (default: kpt-files)

## Dependencies

This module uses `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` for S3/MinIO integration.

