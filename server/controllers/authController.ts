import { Request, Response } from 'express';
import { storage } from '../storage';
import { AuthRequest } from '../middleware/auth';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const user = await storage.getUserByUsername(username);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // In a real application, we would use a library like bcrypt to compare the hashed password
    // For this example, we're doing a direct comparison
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Account is inactive. Please contact administrator." });
    }

    // Get organization name
    const organization = await storage.getOrganization(user.organizationId);
    
    // Create session
    req.session.userId = user.id;
    
    // Send user info (without password)
    const { password: _, ...userInfo } = user;
    return res.status(200).json({
      ...userInfo,
      organizationName: organization?.businessName || "Unknown Organization"
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "An error occurred during login" });
  }
};

export const logout = (req: Request, res: Response) => {
  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "An error occurred during logout" });
    }
    
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: "Logged out successfully" });
  });
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const user = await storage.getUser(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const organization = await storage.getOrganization(user.organizationId);
    
    // Send user info (without password)
    const { password: _, ...userInfo } = user;
    return res.status(200).json({
      ...userInfo,
      organizationName: organization?.businessName || "Unknown Organization"
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ message: "An error occurred" });
  }
};
