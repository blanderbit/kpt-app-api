import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { firebaseConfig } from '../config/firebase.config';
import { ErrorCode } from '../common/error-codes';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // try {
    //   // Initialize Firebase Admin SDK
    //   if (!admin.apps.length) {
    //     this.firebaseApp = admin.initializeApp({
    //       credential: admin.credential.cert({
    //         type: firebaseConfig.type,
    //         project_id: firebaseConfig.project_id,
    //         private_key_id: firebaseConfig.private_key_id,
    //         private_key: firebaseConfig.private_key,
    //         client_email: firebaseConfig.client_email,
    //         client_id: firebaseConfig.client_id,
    //         auth_uri: firebaseConfig.auth_uri,
    //         token_uri: firebaseConfig.token_uri,
    //         auth_provider_x509_cert_url: firebaseConfig.auth_provider_x509_cert_url,
    //         client_x509_cert_url: firebaseConfig.client_x509_cert_url,
    //       } as any),
    //     });
    //   } else {
    //     this.firebaseApp = admin.app();
    //   }
    // } catch (error) {
    //   throw AppException.internal(
    //     ErrorCode.FIREBASE_INITIALIZATION_FAILED,
    //     `Failed to initialize Firebase: ${error.message}`
    //   );
    // }
  }

  getAuth(): admin.auth.Auth {
    if (!this.firebaseApp) {
      throw AppException.serviceUnavailable(
        ErrorCode.FIREBASE_SERVICE_UNAVAILABLE,
        'Firebase service is not initialized'
      );
    }
    return this.firebaseApp.auth();
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await this.firebaseApp.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      // Handle specific Firebase auth errors
      if (error.code === 'auth/id-token-expired') {
        throw AppException.unauthorized(
          ErrorCode.FIREBASE_TOKEN_EXPIRED,
          `Firebase ID token expired: ${error.message}`
        );
      }
      
      if (error.code === 'auth/id-token-revoked') {
        throw AppException.unauthorized(
          ErrorCode.FIREBASE_TOKEN_REVOKED,
          `Firebase ID token revoked: ${error.message}`
        );
      }
      
      if (error.code === 'auth/invalid-id-token') {
        throw AppException.unauthorized(
          ErrorCode.FIREBASE_TOKEN_INVALID,
          `Invalid Firebase ID token: ${error.message}`
        );
      }
      
      if (error.code === 'auth/id-token-malformed') {
        throw AppException.unauthorized(
          ErrorCode.FIREBASE_TOKEN_MALFORMED,
          `Malformed Firebase ID token: ${error.message}`
        );
      }
      
      // Generic token verification error
      throw AppException.unauthorized(
        ErrorCode.FIREBASE_TOKEN_VERIFICATION_FAILED,
        `Failed to verify Firebase ID token: ${error.message}`
      );
    }
  }

  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.firebaseApp.auth().getUser(uid);
    } catch (error) {
      // Handle specific Firebase user errors
      if (error.code === 'auth/user-not-found') {
        throw AppException.notFound(
          ErrorCode.FIREBASE_USER_NOT_FOUND,
          `Firebase user not found with UID: ${uid}. Error: ${error.message}`
        );
      }
      
      if (error.code === 'auth/user-disabled') {
        throw AppException.forbidden(
          ErrorCode.FIREBASE_USER_DISABLED,
          `Firebase user is disabled: ${error.message}`
        );
      }
      
      if (error.code === 'auth/user-deleted') {
        throw AppException.notFound(
          ErrorCode.FIREBASE_USER_DELETED,
          `Firebase user has been deleted: ${error.message}`
        );
      }
      
      if (error.code === 'auth/permission-denied') {
        throw AppException.forbidden(
          ErrorCode.FIREBASE_PERMISSION_DENIED,
          `Permission denied to access Firebase user: ${error.message}`
        );
      }
      
      // Generic user operation error
      throw AppException.internal(
        ErrorCode.FIREBASE_OPERATION_FAILED,
        `Failed to get Firebase user by UID ${uid}: ${error.message}`
      );
    }
  }

  async createCustomToken(uid: string, additionalClaims?: object): Promise<string> {
    try {
      return await this.firebaseApp.auth().createCustomToken(uid, additionalClaims);
    } catch (error) {
      // Handle specific Firebase custom token errors
      if (error.code === 'auth/invalid-uid') {
        throw AppException.validation(
          ErrorCode.FIREBASE_CUSTOM_TOKEN_CREATION_FAILED,
          `Invalid UID provided for custom token: ${error.message}`
        );
      }
      
      if (error.code === 'auth/uid-already-exists') {
        throw AppException.conflict(
          ErrorCode.FIREBASE_CUSTOM_TOKEN_CREATION_FAILED,
          `UID already exists for custom token: ${error.message}`
        );
      }
      
      if (error.code === 'auth/permission-denied') {
        throw AppException.forbidden(
          ErrorCode.FIREBASE_PERMISSION_DENIED,
          `Permission denied to create custom token: ${error.message}`
        );
      }
      
      // Generic custom token creation error
      throw AppException.internal(
        ErrorCode.FIREBASE_CUSTOM_TOKEN_CREATION_FAILED,
        `Failed to create Firebase custom token for UID ${uid}: ${error.message}`
      );
    }
  }
}
