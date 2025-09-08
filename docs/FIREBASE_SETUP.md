# 🔥 Firebase Setup Guide

## Overview

This guide provides comprehensive instructions for setting up Firebase integration with the KPT Application, including authentication, database configuration, and security rules.

## 🏗️ Firebase Services

### Core Services

- **Firebase Authentication** - User authentication and management
- **Firebase Firestore** - NoSQL database for real-time data
- **Firebase Storage** - File storage and management
- **Firebase Functions** - Serverless backend functions
- **Firebase Hosting** - Static website hosting

### Integration Features

- **OAuth Authentication** - Google, Facebook, Apple sign-in
- **Email/Password Authentication** - Traditional login system
- **Real-time Database** - Live data synchronization
- **File Upload** - Profile pictures and document storage
- **Push Notifications** - User engagement features

## 🔧 Installation and Configuration

### 1. Install Dependencies

```bash
npm install firebase
npm install @nestjs/firebase
npm install firebase-admin
```

### 2. Firebase Project Setup

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `kpt-app`
4. Enable Google Analytics (optional)
5. Click "Create project"

#### Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable sign-in methods:
   - **Email/Password**
   - **Google**
   - **Facebook**
   - **Apple** (iOS only)

#### Configure Firestore Database

1. Go to "Firestore Database"
2. Click "Create database"
3. Choose security mode: "Start in test mode"
4. Select location: Choose closest to your users
5. Click "Done"

#### Setup Storage

1. Go to "Storage"
2. Click "Get started"
3. Choose security mode: "Start in test mode"
4. Select location: Same as Firestore
5. Click "Done"

### 3. Environment Configuration

#### Firebase Configuration

```bash
# .env file
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

#### Service Account Setup

1. In Firebase Console, go to "Project settings"
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. Download JSON file
5. Extract values to environment variables

### 4. Module Configuration

```typescript
// firebase.module.ts
import { Module } from '@nestjs/common';
import { FirebaseModule } from '@nestjs/firebase';
import { FirebaseService } from './firebase.service';

@Module({
  imports: [
    FirebaseModule.forRoot({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    }),
  ],
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
```

## 🔐 Authentication Setup

### 1. Firebase Auth Configuration

```typescript
// firebase-auth.config.ts
export const firebaseAuthConfig = {
  signInOptions: [
    {
      provider: 'google',
      scopes: ['email', 'profile'],
    },
    {
      provider: 'facebook',
      scopes: ['email', 'public_profile'],
    },
    {
      provider: 'apple',
      scopes: ['email', 'name'],
    },
  ],
  signInFlow: 'popup',
  callbacks: {
    signInSuccessWithAuthResult: (authResult: any) => {
      // Handle successful sign-in
      return false; // Prevent redirect
    },
  },
};
```

### 2. Authentication Service

```typescript
// firebase-auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { UserRecord, CreateRequest } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAuthService {
  private readonly logger = new Logger(FirebaseAuthService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async createUser(userData: CreateRequest): Promise<UserRecord> {
    try {
      const userRecord = await this.firebaseService.auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
      });

      this.logger.log(`User created: ${userRecord.uid}`);
      return userRecord;
    } catch (error) {
      this.logger.error('Failed to create user:', error);
      throw error;
    }
  }

  async getUserByUid(uid: string): Promise<UserRecord> {
    try {
      return await this.firebaseService.auth.getUser(uid);
    } catch (error) {
      this.logger.error(`Failed to get user ${uid}:`, error);
      throw error;
    }
  }

  async updateUser(uid: string, updateData: any): Promise<UserRecord> {
    try {
      return await this.firebaseService.auth.updateUser(uid, updateData);
    } catch (error) {
      this.logger.error(`Failed to update user ${uid}:`, error);
      throw error;
    }
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      await this.firebaseService.auth.deleteUser(uid);
      this.logger.log(`User deleted: ${uid}`);
    } catch (error) {
      this.logger.error(`Failed to delete user ${uid}:`, error);
      throw error;
    }
  }

  async verifyIdToken(idToken: string): Promise<any> {
    try {
      return await this.firebaseService.auth.verifyIdToken(idToken);
    } catch (error) {
      this.logger.error('Failed to verify ID token:', error);
      throw error;
    }
  }

  async createCustomToken(uid: string, claims?: any): Promise<string> {
    try {
      return await this.firebaseService.auth.createCustomToken(uid, claims);
    } catch (error) {
      this.logger.error(`Failed to create custom token for ${uid}:`, error);
      throw error;
    }
  }
}
```

### 3. Authentication Guard

```typescript
// firebase-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseAuthService } from './firebase-auth.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebaseAuthService: FirebaseAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decodedToken = await this.firebaseAuthService.verifyIdToken(token);
      request.user = decodedToken;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

## 🗄️ Firestore Database Setup

### 1. Database Service

```typescript
// firestore.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

@Injectable()
export class FirestoreService {
  private readonly logger = new Logger(FirestoreService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async createDocument(collection: string, data: DocumentData): Promise<string> {
    try {
      const docRef = await this.firebaseService.firestore
        .collection(collection)
        .add(data);

      this.logger.log(`Document created in ${collection}: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      this.logger.error(`Failed to create document in ${collection}:`, error);
      throw error;
    }
  }

  async getDocument(collection: string, id: string): Promise<DocumentData | null> {
    try {
      const doc = await this.firebaseService.firestore
        .collection(collection)
        .doc(id)
        .get();

      return doc.exists ? doc.data() : null;
    } catch (error) {
      this.logger.error(`Failed to get document ${id} from ${collection}:`, error);
      throw error;
    }
  }

  async updateDocument(collection: string, id: string, data: DocumentData): Promise<void> {
    try {
      await this.firebaseService.firestore
        .collection(collection)
        .doc(id)
        .update(data);

      this.logger.log(`Document updated in ${collection}: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to update document ${id} in ${collection}:`, error);
      throw error;
    }
  }

  async deleteDocument(collection: string, id: string): Promise<void> {
    try {
      await this.firebaseService.firestore
        .collection(collection)
        .doc(id)
        .delete();

      this.logger.log(`Document deleted from ${collection}: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete document ${id} from ${collection}:`, error);
      throw error;
    }
  }

  async queryDocuments(collection: string, query: any): Promise<DocumentData[]> {
    try {
      let queryRef = this.firebaseService.firestore.collection(collection);

      // Apply filters
      if (query.where) {
        query.where.forEach((condition: any) => {
          queryRef = queryRef.where(condition.field, condition.operator, condition.value);
        });
      }

      // Apply ordering
      if (query.orderBy) {
        query.orderBy.forEach((order: any) => {
          queryRef = queryRef.orderBy(order.field, order.direction);
        });
      }

      // Apply pagination
      if (query.limit) {
        queryRef = queryRef.limit(query.limit);
      }

      if (query.startAfter) {
        queryRef = queryRef.startAfter(query.startAfter);
      }

      const snapshot = await queryRef.get();
      return snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      this.logger.error(`Failed to query documents from ${collection}:`, error);
      throw error;
    }
  }
}
```

### 2. Database Models

```typescript
// models/user.model.ts
export interface FirestoreUser {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    timezone: string;
  };
}

// models/activity.model.ts
export interface FirestoreActivity {
  id: string;
  userId: string;
  activityName: string;
  activityType: string;
  content: any;
  status: 'active' | 'completed' | 'cancelled';
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  tags: string[];
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}
```

## 📁 Storage Setup

### 1. Storage Service

```typescript
// firebase-storage.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { UploadOptions } from 'firebase-admin/storage';

@Injectable()
export class FirebaseStorageService {
  private readonly logger = new Logger(FirebaseStorageService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async uploadFile(
    bucket: string,
    destination: string,
    file: Buffer,
    options?: UploadOptions
  ): Promise<string> {
    try {
      const bucketRef = this.firebaseService.storage.bucket(bucket);
      const fileRef = bucketRef.file(destination);

      await fileRef.save(file, options);

      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '03-01-2500', // Far future expiration
      });

      this.logger.log(`File uploaded to ${destination}`);
      return url;
    } catch (error) {
      this.logger.error(`Failed to upload file to ${destination}:`, error);
      throw error;
    }
  }

  async deleteFile(bucket: string, destination: string): Promise<void> {
    try {
      const bucketRef = this.firebaseService.storage.bucket(bucket);
      await bucketRef.file(destination).delete();

      this.logger.log(`File deleted: ${destination}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${destination}:`, error);
      throw error;
    }
  }

  async getFileUrl(bucket: string, destination: string): Promise<string> {
    try {
      const bucketRef = this.firebaseService.storage.bucket(bucket);
      const fileRef = bucketRef.file(destination);

      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '03-01-2500',
      });

      return url;
    } catch (error) {
      this.logger.error(`Failed to get file URL for ${destination}:`, error);
      throw error;
    }
  }

  async updateFileMetadata(
    bucket: string,
    destination: string,
    metadata: any
  ): Promise<void> {
    try {
      const bucketRef = this.firebaseService.storage.bucket(bucket);
      const fileRef = bucketRef.file(destination);

      await fileRef.setMetadata({ metadata });

      this.logger.log(`File metadata updated: ${destination}`);
    } catch (error) {
      this.logger.error(`Failed to update file metadata for ${destination}:`, error);
      throw error;
    }
  }
}
```

### 2. File Upload Controller

```typescript
// file-upload.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { FirebaseStorageService } from './firebase-storage.service';

@Controller('files')
@UseGuards(FirebaseAuthGuard)
export class FileUploadController {
  constructor(private readonly storageService: FirebaseStorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const bucket = process.env.FIREBASE_STORAGE_BUCKET;
    const destination = `uploads/${Date.now()}-${file.originalname}`;

    const url = await this.storageService.uploadFile(
      bucket,
      destination,
      file.buffer,
      {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            size: file.size.toString(),
          },
        },
      }
    );

    return {
      success: true,
      data: {
        url,
        destination,
        originalName: file.originalname,
        size: file.size,
      },
      message: 'File uploaded successfully',
    };
  }
}
```

## 🔒 Security Rules

### 1. Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && request.auth.token.admin == true;
    }

    // Activities: users can manage their own, read public ones
    match /activities/{activityId} {
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        resource.data.isPublic == true
      );
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }

    // Public collections
    match /activity-types/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    // Admin-only collections
    match /admin/{document=**} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

### 2. Storage Security Rules

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload to their own folder
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Public uploads folder
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Admin folder
    match /admin/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## 🚀 Usage Examples

### 1. User Authentication

```typescript
// auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(private readonly firebaseAuthService: FirebaseAuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const userRecord = await this.firebaseAuthService.createUser({
      email: registerDto.email,
      password: registerDto.password,
      displayName: `${registerDto.firstName} ${registerDto.lastName}`,
    });

    return {
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      },
      message: 'User registered successfully',
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // Verify credentials and create custom token
    const customToken = await this.firebaseAuthService.createCustomToken(
      loginDto.uid
    );

    return {
      success: true,
      data: { customToken },
      message: 'Login successful',
    };
  }
}
```

### 2. Database Operations

```typescript
// activities.service.ts
@Injectable()
export class ActivitiesService {
  constructor(private readonly firestoreService: FirestoreService) {}

  async createActivity(userId: string, activityData: any): Promise<string> {
    const activity = {
      ...activityData,
      userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    return this.firestoreService.createDocument('activities', activity);
  }

  async getUserActivities(userId: string): Promise<any[]> {
    return this.firestoreService.queryDocuments('activities', {
      where: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  async getPublicActivities(): Promise<any[]> {
    return this.firestoreService.queryDocuments('activities', {
      where: [{ field: 'isPublic', operator: '==', value: true }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: 20,
    });
  }
}
```

### 3. File Management

```typescript
// profile.service.ts
@Injectable()
export class ProfileService {
  constructor(private readonly storageService: FirebaseStorageService) {}

  async updateProfilePicture(userId: string, file: Buffer): Promise<string> {
    const destination = `users/${userId}/profile-picture.jpg`;
    const bucket = process.env.FIREBASE_STORAGE_BUCKET;

    const url = await this.storageService.uploadFile(
      bucket,
      destination,
      file,
      {
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            userId,
            type: 'profile-picture',
          },
        },
      }
    );

    return url;
  }
}
```

## 🧪 Testing

### 1. Unit Tests

```typescript
describe('FirebaseAuthService', () => {
  it('should create user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
    };

    const result = await service.createUser(userData);
    
    expect(result.uid).toBeDefined();
    expect(result.email).toBe(userData.email);
  });
});
```

### 2. Integration Tests

```typescript
describe('Firebase Integration (e2e)', () => {
  it('should authenticate user with Firebase', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(200);

    expect(response.body.data.customToken).toBeDefined();
  });
});
```

## 🔧 Configuration

### Environment Variables

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Firebase Auth Configuration
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199

# Security Configuration
FIREBASE_AUTH_DISABLED=false
FIREBASE_EMULATOR_ENABLED=false
```

### Configuration Service

```typescript
// firebase.config.ts
export const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  auth: {
    disabled: process.env.FIREBASE_AUTH_DISABLED === 'true',
  },
  emulator: {
    enabled: process.env.FIREBASE_EMULATOR_ENABLED === 'true',
    auth: process.env.FIREBASE_AUTH_EMULATOR_HOST,
    firestore: process.env.FIRESTORE_EMULATOR_HOST,
    storage: process.env.FIREBASE_STORAGE_EMULATOR_HOST,
  },
};
```

## 🚀 Best Practices

### 1. Security
- Always validate user permissions
- Use security rules for Firestore and Storage
- Implement proper authentication guards
- Validate input data before database operations

### 2. Performance
- Use pagination for large queries
- Implement caching for frequently accessed data
- Use batch operations for multiple writes
- Optimize database indexes

### 3. Error Handling
- Implement comprehensive error handling
- Log all Firebase operations
- Provide meaningful error messages
- Implement retry mechanisms

### 4. Monitoring
- Track Firebase usage and costs
- Monitor authentication attempts
- Log database operations
- Set up alerts for errors

## 🎯 Conclusion

Firebase provides a robust and scalable backend solution for the KPT Application. Key benefits include:

- **Scalability**: Automatic scaling based on usage
- **Real-time**: Live data synchronization
- **Security**: Built-in authentication and security rules
- **Integration**: Seamless integration with other Google services
- **Cost-effective**: Pay-as-you-go pricing model

Follow the best practices outlined in this guide to ensure secure, performant, and maintainable Firebase integration.

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage Rules](https://firebase.google.com/docs/storage/security)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
