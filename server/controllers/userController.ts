import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { storage } from '../storage';
import { insertUserSchema } from '@shared/schema';

// Get all users
export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    // Get all users
    const users = await storage.listUsers();
    
    // Get organization names for each user
    const usersWithOrgs = await Promise.all(
      users.map(async user => {
        const org = await storage.getOrganization(user.organizationId);
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          organizationName: org?.businessName || 'Unknown Organization'
        };
      })
    );
    
    return res.status(200).json(usersWithOrgs);
  } catch (error) {
    console.error("List users error:", error);
    return res.status(500).json({ message: "An error occurred while fetching users" });
  }
};

// Get one user
export const getUser = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  
  try {
    const user = await storage.getUser(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const organization = await storage.getOrganization(user.organizationId);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    return res.status(200).json({
      ...userWithoutPassword,
      organizationName: organization?.businessName || 'Unknown Organization'
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ message: "An error occurred while fetching the user" });
  }
};

// Create user
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    // Validate request body
    const validatedData = insertUserSchema.parse(req.body);
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(validatedData.username);
    
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    // Check if organization exists
    const organization = await storage.getOrganization(validatedData.organizationId);
    
    if (!organization) {
      return res.status(400).json({ message: "Organization not found" });
    }
    
    // Create the user
    const user = await storage.createUser(validatedData);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    return res.status(201).json({
      ...userWithoutPassword,
      organizationName: organization.businessName
    });
  } catch (error) {
    console.error("Create user error:", error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: "Invalid user data", errors: error.errors });
    }
    return res.status(500).json({ message: "An error occurred while creating the user" });
  }
};

// Update user
export const updateUser = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  
  try {
    // Check if user exists
    const existingUser = await storage.getUser(id);
    
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Validate request body - partial validation for updates
    const validatedData = insertUserSchema.partial().parse(req.body);
    
    // If username is being changed, check if it's unique
    if (validatedData.username && validatedData.username !== existingUser.username) {
      const userWithSameUsername = await storage.getUserByUsername(validatedData.username);
      
      if (userWithSameUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }
    
    // If organization is being changed, check if it exists
    if (validatedData.organizationId) {
      const organization = await storage.getOrganization(validatedData.organizationId);
      
      if (!organization) {
        return res.status(400).json({ message: "Organization not found" });
      }
    }
    
    // Update the user
    const updatedUser = await storage.updateUser(id, validatedData);
    
    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update user" });
    }
    
    const organization = await storage.getOrganization(updatedUser.organizationId);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    return res.status(200).json({
      ...userWithoutPassword,
      organizationName: organization?.businessName || 'Unknown Organization'
    });
  } catch (error) {
    console.error("Update user error:", error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: "Invalid user data", errors: error.errors });
    }
    return res.status(500).json({ message: "An error occurred while updating the user" });
  }
};

// Delete user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  
  // Prevent deleting yourself
  if (req.user.id === id) {
    return res.status(400).json({ message: "You cannot delete your own account" });
  }
  
  try {
    // Check if user exists
    const existingUser = await storage.getUser(id);
    
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Delete user
    const deleted = await storage.deleteUser(id);
    
    if (!deleted) {
      return res.status(500).json({ message: "Failed to delete user" });
    }
    
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ message: "An error occurred while deleting the user" });
  }
};
