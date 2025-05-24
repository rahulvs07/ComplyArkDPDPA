import { Request } from 'express';
import { User } from '../shared/schema';

export interface AuthRequest extends Request {
  user?: User;
}