export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

export class NotFoundException extends AppError {
  constructor(message: string) {
    super(message, 404);
    this.name = 'NotFoundException';
  }
}

export class ConflictException extends AppError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'ConflictException';
  }
}

export class UnauthorizedException extends AppError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'UnauthorizedException';
  }
}

export class BadRequestException extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'BadRequestException';
  }
}

export class ForbiddenException extends AppError {
  constructor(message: string) {
    super(message, 403);
    this.name = 'ForbiddenException';
  }
}

export class InternalServerErrorException extends AppError {
  constructor(message: string) {
    super(message, 500);
    this.name = 'InternalServerErrorException';
  }
}
