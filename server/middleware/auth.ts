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

// Middleware to check if user can manage request statuses
export const canManageRequests = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('canManageRequests - req.user:', req.user);
  console.log('canManageRequests - session:', req.session);
  
  // All authenticated users (including regular users) can view and update request statuses
  if (req.user) {
    return next();
  }
  
  return res.status(403).json({
    message: "Forbidden. You need to be logged in to manage requests."
  });
};

// Middleware to check if user is authenticated
export const isAuthenticated = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Check if user is authenticated via session
  if (req.session && (req.session.userId || req.session.isSuperAdmin)) {
    try {
      // Check for superadmin user (hardcoded credentials)
      const SUPER_ADMIN_USERNAME = "complyarkadmin";
      
      if (req.session.isSuperAdmin || req.session.username === SUPER_ADMIN_USERNAME) {
        // Create superadmin user object
        req.user = {
          id: 999, // Special ID for superadmin
          username: SUPER_ADMIN_USERNAME,
          firstName: "System",
          lastName: "Administrator",
          organizationId: 32, // ComplyArk Systems organization ID
          role: "superadmin" // Special role for superadmin
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

// Middleware to check if user is the superadmin (complyarkadmin only)
export const isSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && req.user.username === 'complyarkadmin') {
    return next();
  }
  
  return res.status(403).json({
    message: "Forbidden. Super Admin privileges required."
  });
};

// Middleware to check if user is an organization admin
export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
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
  
  // Super admin can access any organization's data
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }
  
  // Organization users/admins can only access their own organization's data
  if (req.user && req.user.organizationId === orgId) {
    return next();
  }
  
  return res.status(403).json({
    message: "Forbidden. You can only access resources for your organization."
  });
};
