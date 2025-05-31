import { Request, Response } from 'express';
import { storage } from '../storage';

interface AuthRequest extends Request {
  user?: any;
}

export const listDPRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized. Please login to access this resource." });
    }

    let requests;
    
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      // Super admin can see all requests
      requests = await storage.listDPRequests();
    } else {
      // Organization admin and users can only see their organization's requests
      requests = await storage.listDPRequests(req.user.organizationId);
    }

    // Add computed fields
    const requestsWithDetails = await Promise.all(requests.map(async (request) => {
      const status = await storage.getRequestStatus(request.statusId);
      let assignedUser = null;
      
      if (request.assignedToUserId) {
        assignedUser = await storage.getUser(request.assignedToUserId);
      }

      return {
        ...request,
        statusName: status?.statusName || 'Unknown',
        assignedToUserName: assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : null
      };
    }));

    res.json(requestsWithDetails);
  } catch (error) {
    console.error('List DPRequests error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getDPRequest = async (req: AuthRequest, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized. Please login to access this resource." });
    }

    if (isNaN(requestId)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }

    const request = await storage.getDPRequest(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check if user has access to this request
    if (req.user.organizationId !== request.organizationId && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: "You don't have access to this request" });
    }

    // Get additional details
    const status = await storage.getRequestStatus(request.statusId);
    let assignedUser = null;
    
    if (request.assignedToUserId) {
      assignedUser = await storage.getUser(request.assignedToUserId);
    }

    const requestWithDetails = {
      ...request,
      statusName: status?.statusName || 'Unknown',
      assignedToUserName: assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : null
    };

    res.json(requestWithDetails);
  } catch (error) {
    console.error('Get DPRequest error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateDPRequest = async (req: AuthRequest, res: Response) => {
  const requestId = parseInt(req.params.id);
  
  console.log('=== DPR UPDATE REQUEST ===');
  console.log('Request ID:', requestId);
  console.log('Request body:', req.body);
  console.log('User:', req.user?.id, req.user?.username);
  
  if (isNaN(requestId)) {
    return res.status(400).json({ message: "Invalid request ID" });
  }

  if (!req.user) {
    return res.status(403).json({ message: "Authentication required" });
  }
  
  try {
    const request = await storage.getDPRequest(requestId);
    
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    
    // Check if user has access to this request
    if (req.user.organizationId !== request.organizationId && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: "You don't have access to this request" });
    }
    
    const { statusId, assignedToUserId, comments } = req.body;
    
    console.log('Processing DPR update - Status:', statusId, 'Current:', request.statusId, 'Comments:', comments);
    
    // Check if there are actual changes or comments
    const hasStatusChange = statusId !== undefined && parseInt(statusId) !== request.statusId;
    const hasAssignmentChange = assignedToUserId !== undefined && req.user.role !== 'user' && 
      (assignedToUserId ? parseInt(assignedToUserId) : null) !== request.assignedToUserId;
    const hasComments = comments && comments.trim() !== '';
    
    console.log('=== DPR UPDATE VALIDATION ===');
    console.log('Has status change:', hasStatusChange);
    console.log('Has assignment change:', hasAssignmentChange);
    console.log('Has comments:', hasComments);
    
    if (!hasStatusChange && !hasAssignmentChange && !hasComments) {
      console.log('No changes detected, returning error');
      return res.status(400).json({ message: "No changes to make" });
    }
    
    console.log('=== PROCEEDING WITH UPDATE ===');
    
    const updateData: any = {};
    
    if (hasStatusChange) {
      updateData.statusId = parseInt(statusId);
      updateData.lastUpdatedAt = new Date();
    }
    
    if (hasAssignmentChange) {
      updateData.assignedToUserId = assignedToUserId ? parseInt(assignedToUserId) : null;
      updateData.lastUpdatedAt = new Date();
    }
    
    console.log('Update data prepared:', updateData);
    
    const updatedDPRequest = await storage.updateDPRequest(requestId, updateData);
    
    if (!updatedDPRequest) {
      console.error('Failed to update DPR request');
      return res.status(404).json({ message: "Failed to update request" });
    }
    
    console.log('DPR updated successfully:', updatedDPRequest);
    
    // Create history entry
    const historyData = {
      requestId: requestId,
      changedByUserId: req.user.id,
      oldStatusId: request.statusId,
      newStatusId: statusId ? parseInt(statusId) : request.statusId,
      oldAssignedToUserId: request.assignedToUserId,
      newAssignedToUserId: assignedToUserId ? parseInt(assignedToUserId) : request.assignedToUserId,
      comments: comments || null,
      changeDate: new Date()
    };
    
    console.log('Creating DPR history:', historyData);
    
    try {
      await storage.createDPRequestHistory(historyData);
      console.log('History created successfully');
    } catch (historyError) {
      console.error('Error creating history:', historyError);
    }
    
    return res.json(updatedDPRequest);
  } catch (error) {
    console.error("Update DPRequest error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getDPRequestHistory = async (req: AuthRequest, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized. Please login to access this resource." });
    }

    if (isNaN(requestId)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }

    const request = await storage.getDPRequest(requestId);
    
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check if user has access to this request
    if (req.user.organizationId !== request.organizationId && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: "You don't have access to this request" });
    }

    const history = await storage.getDPRequestHistory(requestId);
    res.json(history);
  } catch (error) {
    console.error('Get DPRequest history error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp, token } = req.body;
    
    // Implementation depends on your OTP verification logic
    // This is a placeholder that should be implemented based on your requirements
    
    res.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const submitDPRequest = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, requestType, requestComment, token } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !requestType || !requestComment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find organization by token
    const organizations = await storage.listOrganizations();
    const organization = organizations.find(org => org.requestPageUrlToken === token);
    
    if (!organization) {
      return res.status(404).json({ message: "Invalid organization token" });
    }

    // Get default status (Submitted)
    const statuses = await storage.listRequestStatuses();
    const submittedStatus = statuses.find(status => status.statusName === 'Submitted');
    
    if (!submittedStatus) {
      return res.status(500).json({ message: "System configuration error" });
    }

    const newRequest = {
      organizationId: organization.id,
      firstName,
      lastName,
      email,
      phone,
      requestType,
      requestComment,
      statusId: submittedStatus.statusId,
      assignedToUserId: null,
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
      completionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      completedOnTime: null,
      closedDateTime: null,
      closureComments: null
    };

    const createdRequest = await storage.createDPRequest(newRequest);
    
    res.status(201).json({
      success: true,
      message: "Data protection request submitted successfully",
      requestId: createdRequest.requestId
    });
  } catch (error) {
    console.error('Submit DPRequest error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getRequestStatuses = async (req: Request, res: Response) => {
  try {
    const statuses = await storage.listRequestStatuses();
    res.json(statuses);
  } catch (error) {
    console.error('Get request statuses error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getOrganizationUsers = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = parseInt(req.params.organizationId);

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized. Please login to access this resource." });
    }

    if (isNaN(organizationId)) {
      return res.status(400).json({ message: "Invalid organization ID" });
    }

    // Check if user has access to this organization
    if (req.user.organizationId !== organizationId && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: "You don't have access to this organization" });
    }

    const users = await storage.getOrganizationUsers(organizationId);
    res.json(users);
  } catch (error) {
    console.error('Get organization users error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};