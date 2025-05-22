import { Request, Response } from 'express';
import { storage } from '../storage';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { insertDPRequestSchema, insertGrievanceSchema } from '@shared/schema';

// Generate a unique URL token for an organization
export async function generateRequestPageUrl(req: Request, res: Response) {
  try {
    const organizationId = parseInt(req.params.id);
    
    if (isNaN(organizationId)) {
      return res.status(400).json({ message: 'Invalid organization ID' });
    }
    
    // Check if organization exists
    const organization = await storage.getOrganization(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    // Generate a unique token
    const token = uuidv4();
    
    // Update organization with the new token
    await storage.updateOrganization(organizationId, {
      ...organization,
      requestPageUrlToken: token
    });
    
    // Return the generated URL to the client
    return res.status(200).json({ 
      url: `${req.protocol}://${req.get('host')}/request-page/${token}` 
    });
  } catch (error) {
    console.error('Error generating request page URL:', error);
    return res.status(500).json({ message: 'Error generating URL' });
  }
}

// Validate and process external data protection request submissions
export async function submitDataProtectionRequest(req: Request, res: Response) {
  try {
    // Validate the organization token
    const token = req.params.token;
    if (!token) {
      return res.status(400).json({ message: 'Invalid request' });
    }
    
    // Find organization by token
    const organization = await storage.getOrganizationByToken(token);
    if (!organization) {
      return res.status(404).json({ message: 'Invalid organization URL' });
    }
    
    // Get default "New" status
    const requestStatuses = await storage.listRequestStatuses();
    const newStatus = requestStatuses.find(status => status.statusName === 'New');
    
    if (!newStatus) {
      return res.status(500).json({ message: 'Request status configuration error' });
    }
    
    // Process based on request type (DP Request or Grievance)
    const requestType = req.body.submissionType;
    
    if (requestType === 'dpRequest') {
      // Validate Data Protection Request
      const dpRequestSchema = insertDPRequestSchema.extend({
        submissionType: z.literal('dpRequest')
      });
      
      const validationResult = dpRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid data protection request data',
          errors: validationResult.error.format() 
        });
      }
      
      // Create DP Request
      const { submissionType, ...dpRequestData } = validationResult.data;
      
      // Set organization ID and initial status
      const request = await storage.createDPRequest({
        ...dpRequestData,
        organizationId: organization.id,
        statusId: newStatus.statusId,
        lastUpdatedAt: new Date(),
      });
      
      return res.status(201).json({
        message: 'Data protection request submitted successfully',
        requestId: request.requestId
      });
    }
    else if (requestType === 'grievance') {
      // Validate Grievance
      const grievanceSchema = insertGrievanceSchema.extend({
        submissionType: z.literal('grievance')
      });
      
      const validationResult = grievanceSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid grievance data',
          errors: validationResult.error.format() 
        });
      }
      
      // Create Grievance
      const { submissionType, ...grievanceData } = validationResult.data;
      
      // Set organization ID and initial status
      const grievance = await storage.createGrievance({
        ...grievanceData,
        organizationId: organization.id,
        statusId: newStatus.statusId,
        lastUpdatedAt: new Date(),
      });
      
      return res.status(201).json({
        message: 'Grievance submitted successfully',
        grievanceId: grievance.grievanceId
      });
    } 
    else {
      return res.status(400).json({ message: 'Invalid submission type' });
    }
  } catch (error) {
    console.error('Error submitting request:', error);
    return res.status(500).json({ message: 'Error processing submission' });
  }
}

// Check request status by ID and email
export async function checkRequestStatus(req: Request, res: Response) {
  try {
    const { id, email, type } = req.query;
    
    if (!id || !email || !type) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    const requestId = parseInt(id as string);
    const requestType = type as string;
    
    if (isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }
    
    if (requestType === 'dpRequest') {
      // Find DP Request
      const request = await storage.getDPRequest(requestId);
      
      if (!request || request.email !== email) {
        return res.status(404).json({ message: 'Request not found or email does not match' });
      }
      
      // Get status name
      const status = await storage.getRequestStatus(request.statusId);
      
      return res.status(200).json({
        requestId: request.requestId,
        status: status?.statusName || 'Unknown',
        lastUpdated: request.lastUpdatedAt,
        type: 'Data Protection Request'
      });
    }
    else if (requestType === 'grievance') {
      // Find Grievance
      const grievance = await storage.getGrievance(requestId);
      
      if (!grievance || grievance.email !== email) {
        return res.status(404).json({ message: 'Grievance not found or email does not match' });
      }
      
      // Get status name
      const status = await storage.getRequestStatus(grievance.statusId);
      
      return res.status(200).json({
        requestId: grievance.grievanceId,
        status: status?.statusName || 'Unknown',
        lastUpdated: grievance.lastUpdatedAt,
        type: 'Grievance'
      });
    }
    else {
      return res.status(400).json({ message: 'Invalid request type' });
    }
  } catch (error) {
    console.error('Error checking request status:', error);
    return res.status(500).json({ message: 'Error checking status' });
  }
}