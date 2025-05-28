import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { storage } from '../storage';
import { insertDPRequestSchema, insertDPRequestHistorySchema } from '@shared/schema';
import crypto from 'crypto';
import { 
  sendDPRSubmissionNotification, 
  sendStatusChangeNotification, 
  sendEscalationNotification,
  sendAssignmentNotification 
} from '../utils/emailService';

// Store OTPs temporarily in memory
const otpStore = new Map<string, { otp: string, expires: number }>();

// Get all DPRequests for an organization
export const listDPRequests = async (req: AuthRequest, res: Response) => {
  const orgId = parseInt(req.params.orgId);
  
  if (isNaN(orgId)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }
  
  // Ensure users can only view data from their own organization
  if (req.user && req.user.role !== 'superadmin' && orgId !== req.user.organizationId) {
    return res.status(403).json({ message: "You can only access data from your own organization" });
  }
  
  const statusId = req.query.statusId ? parseInt(req.query.statusId as string) : undefined;
  
  try {
    let requests = await storage.listDPRequests(orgId, statusId);
    
    // Enrich data with status name and assigned user name
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const status = await storage.getRequestStatus(request.statusId);
        let assignedUser = null;
        
        if (request.assignedToUserId) {
          assignedUser = await storage.getUser(request.assignedToUserId);
        }
        
        return {
          ...request,
          statusName: status?.statusName || 'Unknown',
          assignedToName: assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : 'Unassigned'
        };
      })
    );
    
    return res.status(200).json(enrichedRequests);
  } catch (error) {
    console.error("List DPRequests error:", error);
    return res.status(500).json({ message: "An error occurred while fetching requests" });
  }
};

// Get one DPRequest
export const getDPRequest = async (req: AuthRequest, res: Response) => {
  const requestId = parseInt(req.params.id);
  
  if (isNaN(requestId)) {
    return res.status(400).json({ message: "Invalid request ID" });
  }
  
  try {
    const request = await storage.getDPRequest(requestId);
    
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    
    // Check if user has access to this request
    if (req.user.organizationId !== request.organizationId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "You don't have access to this request" });
    }
    
    const status = await storage.getRequestStatus(request.statusId);
    let assignedUser = null;
    
    if (request.assignedToUserId) {
      assignedUser = await storage.getUser(request.assignedToUserId);
    }
    
    return res.status(200).json({
      ...request,
      statusName: status?.statusName || 'Unknown',
      assignedToName: assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : 'Unassigned'
    });
  } catch (error) {
    console.error("Get DPRequest error:", error);
    return res.status(500).json({ message: "An error occurred while fetching the request" });
  }
};

// Get history for a DPRequest
export const getDPRequestHistory = async (req: AuthRequest, res: Response) => {
  const requestId = parseInt(req.params.id);
  
  if (isNaN(requestId)) {
    return res.status(400).json({ message: "Invalid request ID" });
  }
  
  try {
    const request = await storage.getDPRequest(requestId);
    
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    
    // Check if user has access to this request
    if (req.user.organizationId !== request.organizationId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "You don't have access to this request" });
    }
    
    const history = await storage.listDPRequestHistory(requestId);
    
    // Enrich with user names and status names
    const enrichedHistory = await Promise.all(
      history.map(async (entry) => {
        const changedBy = await storage.getUser(entry.changedByUserId);
        
        let oldStatus = null;
        let newStatus = null;
        let oldAssignedTo = null;
        let newAssignedTo = null;
        
        if (entry.oldStatusId) {
          oldStatus = await storage.getRequestStatus(entry.oldStatusId);
        }
        
        if (entry.newStatusId) {
          newStatus = await storage.getRequestStatus(entry.newStatusId);
        }
        
        if (entry.oldAssignedToUserId) {
          oldAssignedTo = await storage.getUser(entry.oldAssignedToUserId);
        }
        
        if (entry.newAssignedToUserId) {
          newAssignedTo = await storage.getUser(entry.newAssignedToUserId);
        }
        
        return {
          ...entry,
          changedByName: changedBy ? `${changedBy.firstName} ${changedBy.lastName}` : 'Unknown',
          oldStatusName: oldStatus?.statusName,
          newStatusName: newStatus?.statusName,
          oldAssignedToName: oldAssignedTo ? `${oldAssignedTo.firstName} ${oldAssignedTo.lastName}` : null,
          newAssignedToName: newAssignedTo ? `${newAssignedTo.firstName} ${newAssignedTo.lastName}` : null
        };
      })
    );
    
    return res.status(200).json(enrichedHistory);
  } catch (error) {
    console.error("Get DPRequest history error:", error);
    return res.status(500).json({ message: "An error occurred while fetching the request history" });
  }
};

// Update DPRequest
export const updateDPRequest = async (req: AuthRequest, res: Response) => {
  const requestId = parseInt(req.params.id);
  
  if (isNaN(requestId)) {
    return res.status(400).json({ message: "Invalid request ID" });
  }
  
  try {
    // Get the original request first for history tracking
    const originalRequest = await storage.getDPRequest(requestId);
    if (!originalRequest) {
      return res.status(404).json({ message: "Request not found" });
    }
    
    const { statusId, assignedToUserId, closureComments } = req.body;
    
    const updateData: any = {};
    if (statusId !== undefined) updateData.statusId = statusId;
    if (assignedToUserId !== undefined) updateData.assignedToUserId = assignedToUserId;
    if (closureComments !== undefined) updateData.closureComments = closureComments;
    
    const updatedRequest = await storage.updateDPRequest(requestId, updateData);
    
    if (!updatedRequest) {
      return res.status(404).json({ message: "Request not found" });
    }
    
    // Create history entry
    const historyEntry = {
      requestId: requestId,
      changedByUserId: req.session?.userId || null,
      oldStatusId: originalRequest.statusId,
      newStatusId: statusId !== undefined ? statusId : originalRequest.statusId,
      oldAssignedToUserId: originalRequest.assignedToUserId,
      newAssignedToUserId: assignedToUserId !== undefined ? assignedToUserId : originalRequest.assignedToUserId,
      comments: closureComments || null,
      changeDate: new Date()
    };
    
    await storage.createDPRequestHistory(historyEntry);
    
    // Create notification for assigned user
    const targetUserId = assignedToUserId || originalRequest.assignedToUserId;
    if (targetUserId) {
      await storage.createNotification({
        userId: targetUserId,
        organizationId: originalRequest.organizationId,
        type: 'dpr_update',
        title: 'DPR Request Updated',
        message: `Request #${requestId} has been updated`,
        isRead: false,
        createdAt: new Date()
      });
    }
    
    return res.status(200).json(updatedRequest);
  } catch (error) {
    console.error("Update DPRequest error:", error);
    return res.status(500).json({ message: "An error occurred while updating the request" });
  }
};

// Public API to request OTP
export const requestOTP = async (req: Request, res: Response) => {
  const { email, token } = req.body;
  
  if (!email || !token) {
    return res.status(400).json({ message: "Email and token are required" });
  }
  
  try {
    // Find organization by token
    const organizations = await storage.listOrganizations();
    const organization = organizations.find(org => org.requestPageUrlToken === token);
    
    if (!organization) {
      return res.status(404).json({ message: "Invalid token" });
    }
    
    // Generate a dummy OTP (in a real app, this would be more secure and sent via email)
    const otp = '123456';
    
    // Store OTP for 5 minutes
    const key = `${email}_${organization.id}`;
    otpStore.set(key, {
      otp,
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
    
    console.log(`Dummy OTP ${otp} for ${email} at org ${organization.id}`);
    
    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Request OTP error:", error);
    return res.status(500).json({ message: "An error occurred while sending OTP" });
  }
};

// Public API to verify OTP
export const verifyOTP = async (req: Request, res: Response) => {
  const { email, otp, token } = req.body;
  
  if (!email || !otp || !token) {
    return res.status(400).json({ message: "Email, OTP, and token are required" });
  }
  
  try {
    // Find organization by token
    const organizations = await storage.listOrganizations();
    const organization = organizations.find(org => org.requestPageUrlToken === token);
    
    if (!organization) {
      return res.status(404).json({ message: "Invalid token" });
    }
    
    // Verify OTP
    const key = `${email}_${organization.id}`;
    const storedOTP = otpStore.get(key);
    
    if (!storedOTP) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }
    
    if (storedOTP.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    
    if (Date.now() > storedOTP.expires) {
      otpStore.delete(key);
      return res.status(400).json({ message: "OTP expired" });
    }
    
    // Mark OTP as used
    otpStore.delete(key);
    
    // Generate a session token (in a real app, this would be JWT or similar)
    const sessionToken = crypto.randomBytes(16).toString('hex');
    
    return res.status(200).json({
      verified: true,
      sessionToken,
      organizationId: organization.id,
      organizationName: organization.businessName
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "An error occurred while verifying OTP" });
  }
};

// Public API to create a data principal request
export const createPublicDPRequest = async (req: Request, res: Response) => {
  const { firstName, lastName, email, phone, requestType, requestComment, token } = req.body;
  
  if (!firstName || !lastName || !email || !phone || !requestType || !token) {
    return res.status(400).json({ message: "All fields are required" });
  }
  
  try {
    // Find organization by token
    const organizations = await storage.listOrganizations();
    const organization = organizations.find(org => org.requestPageUrlToken === token);
    
    if (!organization) {
      return res.status(404).json({ message: "Invalid token" });
    }
    
    // Verify email OTP was validated (in a real app, this would be via session or JWT)
    const key = `${email}_${organization.id}`;
    if (otpStore.has(key)) {
      return res.status(400).json({ message: "Email not verified" });
    }
    
    // Get default admin for this organization
    const orgUsers = await storage.listUsers(organization.id);
    const adminUser = orgUsers.find(user => user.role === 'admin');
    
    if (!adminUser) {
      return res.status(500).json({ message: "No admin found for this organization" });
    }
    
    // Get 'Submitted' status
    const statuses = await storage.listRequestStatuses();
    const submittedStatus = statuses.find(status => status.statusName === 'Submitted');
    
    if (!submittedStatus) {
      return res.status(500).json({ message: "Submitted status not found" });
    }
    
    // Calculate completion date based on SLA
    const createdAt = new Date();
    const completionDate = new Date(createdAt);
    completionDate.setDate(completionDate.getDate() + submittedStatus.slaDays);
    
    // Create the request
    const request = await storage.createDPRequest({
      organizationId: organization.id,
      firstName,
      lastName,
      email,
      phone,
      requestType,
      requestComment,
      statusId: submittedStatus.statusId,
      assignedToUserId: adminUser.id,
      completionDate
    });
    
    // Add initial history entry
    await storage.createDPRequestHistory({
      requestId: request.requestId,
      changedByUserId: adminUser.id,
      newStatusId: submittedStatus.statusId,
      comments: `Request submitted by ${email}. Status: Submitted.`
    });
    
    return res.status(201).json({
      requestId: request.requestId,
      message: "Request created successfully"
    });
  } catch (error) {
    console.error("Create public DPRequest error:", error);
    return res.status(500).json({ message: "An error occurred while creating the request" });
  }
};

// Get dashboard stats
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await storage.getDashboardStats(req.user.organizationId);
    return res.status(200).json(stats);
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return res.status(500).json({ message: "An error occurred while fetching dashboard stats" });
  }
};

// Get recent activities
export const getRecentActivities = async (req: AuthRequest, res: Response) => {
  try {
    const activities = await storage.getRecentActivities(req.user.organizationId);
    return res.status(200).json(activities);
  } catch (error) {
    console.error("Get recent activities error:", error);
    return res.status(500).json({ message: "An error occurred while fetching recent activities" });
  }
};

// Get recent requests
export const getRecentRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await storage.getRecentRequests(req.user.organizationId);
    return res.status(200).json(requests);
  } catch (error) {
    console.error("Get recent requests error:", error);
    return res.status(500).json({ message: "An error occurred while fetching recent requests" });
  }
};
