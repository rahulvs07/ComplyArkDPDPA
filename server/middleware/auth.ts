import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Extended Request interface to include user information
export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    organizationId: number;
    role: string;
  };
}

// Middleware to check if user is authenticated
export const isAuthenticated = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Check if user is authenticated via session
  if (req.session && req.session.userId) {
    try {
      // Check for superadmin user (hardcoded ID)
      const SUPER_ADMIN_ID = 999;
      
      if (req.session.userId === SUPER_ADMIN_ID) {
        // Create superadmin user object
        req.user = {
          id: SUPER_ADMIN_ID,
          username: "complyarkadmin",
          firstName: "System",
          lastName: "Administrator",
          organizationId: 1, // Default organization
          role: "admin"
        };
        return next();
      }
      
      // For regular users, get from database
      const user = await storage.getUser(req.session.userId);
      
      if (user && user.isActive) {
        // Attach user info to request object
        req.user = {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          organizationId: user.organizationId,
          role: user.role
        };
        return next();
      }
    } catch (error) {
      console.error("Authentication error:", error);
    }
  }

  // If no authenticated user found
  return res.status(401).json({
    message: "Unauthorized. Please login to access this resource."
  });
};

// Middleware to check if user is an admin
export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({
    message: "Forbidden. Admin privileges required."
  });
};

// Middleware to check if user belongs to the specified organization
export const isSameOrganization = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const orgId = parseInt(req.params.orgId);
  
  if (req.user && (req.user.organizationId === orgId || req.user.role === 'admin')) {
    return next();
  }
  
  return res.status(403).json({
    message: "Forbidden. You can only access resources for your organization."
  });
};
