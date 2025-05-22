import { Request, Response } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { organizations } from '@shared/schema';

// Schema for DP request submission
const dpRequestSubmissionSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone number is required'),
  requestType: z.enum(['Access', 'Correction', 'Nomination', 'Erasure'], {
    required_error: 'Please select a request type',
  }),
  requestComment: z.string().optional(),
  submissionType: z.literal('dpRequest'),
});

// Schema for grievance submission
const grievanceSubmissionSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone number is required'),
  grievanceComment: z.string().min(1, 'Please describe your grievance'),
  submissionType: z.literal('grievance'),
});

// Schema for status check
const statusCheckSchema = z.object({
  id: z.string().min(1, 'Request ID is required'),
  email: z.string().email('Invalid email format'),
  type: z.enum(['dpRequest', 'grievance'], {
    required_error: 'Please select request type',
  }),
});

// Get organization by request page token
export const getRequestPageByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const organization = await storage.getOrganizationByToken(token);

    if (!organization) {
      return res.status(404).json({ message: 'Request page not found' });
    }

    return res.status(200).json({
      organizationId: organization.id,
      organizationName: organization.businessName,
    });
  } catch (error) {
    console.error('Error getting request page:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Submit request or grievance
export const submitRequest = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const data = req.body;

    // Get organization by token
    const organization = await storage.getOrganizationByToken(token);

    if (!organization) {
      return res.status(404).json({ message: 'Request page not found' });
    }

    // Get default status (Submitted/New)
    const statuses = await storage.listRequestStatuses();
    const defaultStatus = statuses.find(status => status.statusName === 'Submitted' || status.statusName === 'New');

    if (!defaultStatus) {
      return res.status(500).json({ message: 'Default status not found' });
    }

    // Handle data protection request submission
    if (data.submissionType === 'dpRequest') {
      const validationResult = dpRequestSubmissionSchema.safeParse(data);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid request data', 
          errors: validationResult.error.format() 
        });
      }

      const { firstName, lastName, email, phone, requestType, requestComment } = validationResult.data;

      // Create the DP request
      const request = await storage.createDPRequest({
        organizationId: organization.id,
        firstName,
        lastName,
        email,
        phone,
        requestType,
        requestComment: requestComment || null,
        statusId: defaultStatus.statusId,
        assignedToUserId: null,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
        completionDate: null,
        completedOnTime: null,
        closedDateTime: null,
        closureComments: null
      });

      // Create initial history entry
      await storage.createDPRequestHistory({
        requestId: request.requestId,
        changedByUserId: null, // System generated
        oldStatusId: null,
        newStatusId: defaultStatus.statusId,
        oldAssignedToUserId: null,
        newAssignedToUserId: null,
        comments: 'Request submitted via external request page',
        changeDate: new Date()
      });

      return res.status(201).json({ 
        message: 'Request submitted successfully', 
        requestId: request.requestId 
      });
    }
    // Handle grievance submission
    else if (data.submissionType === 'grievance') {
      const validationResult = grievanceSubmissionSchema.safeParse(data);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid grievance data', 
          errors: validationResult.error.format() 
        });
      }

      const { firstName, lastName, email, phone, grievanceComment } = validationResult.data;

      // Create the grievance
      const grievance = await storage.createGrievance({
        organizationId: organization.id,
        firstName,
        lastName,
        email,
        phone,
        grievanceComment,
        statusId: defaultStatus.statusId,
        assignedToUserId: null,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
        completionDate: null,
        completedOnTime: null,
        closedDateTime: null,
        closureComments: null
      });

      // Create initial history entry
      await storage.createGrievanceHistory({
        grievanceId: grievance.grievanceId,
        changedByUserId: null, // System generated
        oldStatusId: null,
        newStatusId: defaultStatus.statusId,
        oldAssignedToUserId: null,
        newAssignedToUserId: null,
        comments: 'Grievance submitted via external request page',
        changeDate: new Date()
      });

      return res.status(201).json({ 
        message: 'Grievance submitted successfully', 
        grievanceId: grievance.grievanceId 
      });
    }

    return res.status(400).json({ message: 'Invalid submission type' });
  } catch (error) {
    console.error('Error submitting request:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Check status of request or grievance
export const checkRequestStatus = async (req: Request, res: Response) => {
  try {
    const validationResult = statusCheckSchema.safeParse(req.query);

    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid status check data', 
        errors: validationResult.error.format() 
      });
    }

    const { id, email, type } = validationResult.data;
    const requestId = parseInt(id, 10);

    if (isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    if (type === 'dpRequest') {
      const request = await storage.getDPRequest(requestId);

      if (!request || request.email !== email) {
        return res.status(404).json({ message: 'Request not found or email does not match' });
      }

      // Get status name
      const statuses = await storage.listRequestStatuses();
      const status = statuses.find(s => s.statusId === request.statusId);

      return res.status(200).json({
        requestId: request.requestId,
        status: status?.statusName || 'Unknown',
        lastUpdated: request.lastUpdatedAt.toISOString(),
        type: 'Data Protection Request'
      });
    } 
    else if (type === 'grievance') {
      const grievance = await storage.getGrievance(requestId);

      if (!grievance || grievance.email !== email) {
        return res.status(404).json({ message: 'Grievance not found or email does not match' });
      }

      // Get status name
      const statuses = await storage.listRequestStatuses();
      const status = statuses.find(s => s.statusId === grievance.statusId);

      return res.status(200).json({
        requestId: grievance.grievanceId,
        status: status?.statusName || 'Unknown',
        lastUpdated: grievance.lastUpdatedAt.toISOString(),
        type: 'Grievance'
      });
    }

    return res.status(400).json({ message: 'Invalid request type' });
  } catch (error) {
    console.error('Error checking request status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Generate or regenerate request page token for an organization
export const generateRequestPageToken = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const orgId = parseInt(organizationId, 10);

    if (isNaN(orgId)) {
      return res.status(400).json({ message: 'Invalid organization ID' });
    }

    const organization = await storage.getOrganization(orgId);

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Generate a random token
    const token = generateRandomToken();

    // Update organization with new token
    const updatedOrg = await storage.updateOrganization(orgId, {
      requestPageUrlToken: token
    });

    if (!updatedOrg) {
      return res.status(500).json({ message: 'Failed to update organization' });
    }

    return res.status(200).json({
      organizationId: updatedOrg.id,
      requestPageUrlToken: updatedOrg.requestPageUrlToken,
      requestPageUrl: `${getBaseUrl()}/request-page/${updatedOrg.requestPageUrlToken}`
    });
  } catch (error) {
    console.error('Error generating request page token:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper function to generate a random token
function generateRandomToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint32Array(length);
  
  // Generate random values using the crypto API if available
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * chars.length);
    }
  }
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
}

// Helper function to get base URL
function getBaseUrl(): string {
  const port = process.env.PORT || '3000';
  const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
  return baseUrl;
}