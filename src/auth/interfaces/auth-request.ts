import { UserRole } from '@prisma/client';
import { Request } from 'express';

export interface AuthRequest extends Request {
  user: {
    id: string;
    name: string;
    role: UserRole;
  };
}
