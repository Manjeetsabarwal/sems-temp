import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/app-error';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  // Handle AppError (our custom errors replacing NestJS exceptions)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      error: err.name,
    });
    return;
  }

  // Handle TypeORM unique constraint violations
  if (err.code === '23505') {
    res.status(409).json({
      statusCode: 409,
      message: 'Duplicate entry - resource already exists',
      error: 'Conflict',
    });
    return;
  }

  // Handle JSON parse errors
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({
      statusCode: 400,
      message: 'Invalid JSON in request body',
      error: 'Bad Request',
    });
    return;
  }

  // Default 500 error
  console.error('Unhandled error:', err);
  res.status(500).json({
    statusCode: 500,
    message: 'Internal server error',
    error: 'Internal Server Error',
  });
}
