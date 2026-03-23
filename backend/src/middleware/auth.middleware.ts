import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export function createAuthMiddleware(usersService: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }

    try {
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const payload = jwt.verify(token, secret) as any;

      const user = await usersService.findById(payload.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ statusCode: 401, message: 'User not found or inactive' });
      }

      (req as any).user = user;
      next();
    } catch {
      return res.status(401).json({ statusCode: 401, message: 'Invalid token' });
    }
  };
}
