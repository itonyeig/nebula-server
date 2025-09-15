import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';


const EXCEPTION_MAP = new Map<string, { status: number; message: string }>([
  // Cognito common
  ['UsernameExistsException', { status: HttpStatus.CONFLICT, message: 'Email already registered' }],
  ['UserNotFoundException', { status: HttpStatus.UNAUTHORIZED, message: 'Invalid email or password' }],
  ['NotAuthorizedException', { status: HttpStatus.UNAUTHORIZED, message: 'Invalid email or password' }],
  ['UserNotConfirmedException', { status: HttpStatus.FORBIDDEN, message: 'User not confirmed' }],
  ['CodeMismatchException', { status: HttpStatus.BAD_REQUEST, message: 'Invalid confirmation code' }],
  ['ExpiredCodeException', { status: HttpStatus.BAD_REQUEST, message: 'Confirmation code expired' }],
  ['InvalidPasswordException', { status: HttpStatus.BAD_REQUEST, message: 'Password does not meet requirements' }],
  ['TooManyRequestsException', { status: HttpStatus.TOO_MANY_REQUESTS, message: 'Too many requests' }],
  ['LimitExceededException', { status: HttpStatus.TOO_MANY_REQUESTS, message: 'Rate limit exceeded' }],
  ['InvalidParameterException', { status: HttpStatus.BAD_REQUEST, message: 'Invalid request parameters' }],
  ['ResourceNotFoundException', { status: HttpStatus.NOT_FOUND, message: 'Resource not found' }],
  ['PasswordResetRequiredException', { status: HttpStatus.FORBIDDEN, message: 'Password reset required' }],
]);

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private defaultMessage = 'Something went wrong';
  catch(exception: unknown, host: ArgumentsHost) {
    Logger.error(exception);
    console.log('error => ', exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred';
    let error = exception.constructor.name || 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || message;
        // Update error based on the actual error or default to a general error message
        error = exception.constructor.name;
      } else {
        message = exceptionResponse.toString();
        error = (exceptionResponse as any).error || error; // This could be updated based on how you want to handle string responses
      }
    } else if (exception instanceof Error) {
      // Check if it matches known error names for dynamic handling
      const errorDetails = EXCEPTION_MAP.get(exception.name);
      if (errorDetails) {
        status = errorDetails.status;
        message = errorDetails?.message || exception.message;
        error =
          message === this.defaultMessage
            ? 'InternalServerErrorException'
            : exception.name; // Maintain the original error name
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = this.defaultMessage;
      }
    }

    response.status(status).json({
      success: false,
      error,
      message,
      // path: request.url
    });
  }
}
