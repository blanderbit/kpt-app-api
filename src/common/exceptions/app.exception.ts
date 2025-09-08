import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, getErrorDescription } from '../error-codes';

/**
 * Unified Application Exception with Error Codes
 * 
 * This exception class provides structured error responses with:
 * - HTTP status code
 * - Custom error code
 * - Error description
 * - Additional context
 * - Module identification
 */

const getModuleFromErrorCode = (code: ErrorCode): string => {
  const codeNum = parseInt(code);
  
  if (codeNum >= 1000 && codeNum < 2000) return 'Admin';
  if (codeNum >= 2000 && codeNum < 3000) return 'Auth';
  if (codeNum >= 3000 && codeNum < 4000) return 'CLI';
  if (codeNum >= 4000 && codeNum < 5000) return 'Profile';
  if (codeNum >= 5000 && codeNum < 6000) return 'Suggested Activity';
  if (codeNum >= 6000 && codeNum < 7000) return 'Email';
  if (codeNum >= 7000 && codeNum < 8000) return 'Firebase';
  if (codeNum >= 8000 && codeNum < 9000) return 'Google Drive';
  if (codeNum >= 9000 && codeNum < 10000) return 'Common/System';
  
  return 'Unknown';
}

export class AppException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly description: string;
  public readonly context?: any;
  public readonly module: string;

  constructor(
    errorCode: ErrorCode,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    customMessage?: string,
    context?: any
  ) {
    const message = customMessage || getErrorDescription(errorCode);
    const module = getModuleFromErrorCode(errorCode);

    super(
      {
        statusCode: status,
        errorCode,
        message,
        description: getErrorDescription(errorCode),
        module,
        timestamp: new Date().toISOString(),
        ...(context && { context })
      },
      status
    );

    this.errorCode = errorCode;
    this.description = getErrorDescription(errorCode);
    this.context = context;
    this.module = module;
  }


  /**
   * Create an unauthorized exception
   */
  static unauthorized(errorCode: ErrorCode, customMessage?: string, context?: any): AppException {
    return new AppException(errorCode, HttpStatus.UNAUTHORIZED, customMessage, context);
  }

  /**
   * Create a forbidden exception
   */
  static forbidden(errorCode: ErrorCode, customMessage?: string, context?: any): AppException {
    return new AppException(errorCode, HttpStatus.FORBIDDEN, customMessage, context);
  }

  /**
   * Create a not found exception
   */
  static notFound(errorCode: ErrorCode, customMessage?: string, context?: any): AppException {
    return new AppException(errorCode, HttpStatus.NOT_FOUND, customMessage, context);
  }

  /**
   * Create a conflict exception
   */
  static conflict(errorCode: ErrorCode, customMessage?: string, context?: any): AppException {
    return new AppException(errorCode, HttpStatus.CONFLICT, customMessage, context);
  }

  /**
   * Create a validation exception
   */
  static validation(errorCode: ErrorCode, customMessage?: string, context?: any): AppException {
    return new AppException(errorCode, HttpStatus.BAD_REQUEST, customMessage, context);
  }

  /**
   * Create an internal server error exception
   */
  static internal(errorCode: ErrorCode, customMessage?: string, context?: any): AppException {
    return new AppException(errorCode, HttpStatus.INTERNAL_SERVER_ERROR, customMessage, context);
  }

  /**
   * Create a service unavailable exception
   */
  static serviceUnavailable(errorCode: ErrorCode, customMessage?: string, context?: any): AppException {
    return new AppException(errorCode, HttpStatus.SERVICE_UNAVAILABLE, customMessage, context);
  }

  /**
   * Create a too many requests exception
   */
  static tooManyRequests(errorCode: ErrorCode, customMessage?: string, context?: any): AppException {
    return new AppException(errorCode, HttpStatus.TOO_MANY_REQUESTS, customMessage, context);
  }

  /**
   * Create a bad gateway exception
   */
  static badGateway(errorCode: ErrorCode, customMessage?: string, context?: any): AppException {
    return new AppException(errorCode, HttpStatus.BAD_GATEWAY, customMessage, context);
  }

  /**
   * Create a gateway timeout exception
   */
  static gatewayTimeout(errorCode: ErrorCode, customMessage?: string, context?: any): AppException {
    return new AppException(errorCode, HttpStatus.GATEWAY_TIMEOUT, customMessage, context);
  }

  /**
   * Get the error response object
   */
  getResponse(): any {
    return {
      statusCode: this.getStatus(),
      errorCode: this.errorCode,
      message: this.message,
      description: this.description,
      module: this.module,
      timestamp: new Date().toISOString(),
      ...(this.context && { context: this.context })
    };
  }

  /**
   * Get formatted error message for CLI output
   */
  getCliMessage(): string {
    const parts = [
      `❌ Error ${this.errorCode}: ${this.message}`,
      `   Module: ${this.module}`,
      `   Description: ${this.description}`,
      `   Status: ${this.getStatus()}`
    ];

    if (this.context) {
      parts.push(`   Context: ${JSON.stringify(this.context, null, 2)}`);
    }

    return parts.join('\n');
  }

  /**
   * Get formatted error message for API response
   */
  getApiMessage(): any {
    return {
      error: true,
      errorCode: this.errorCode,
      message: this.message,
      description: this.description,
      module: this.module,
      statusCode: this.getStatus(),
      timestamp: new Date().toISOString(),
      ...(this.context && { context: this.context })
    };
  }
}
