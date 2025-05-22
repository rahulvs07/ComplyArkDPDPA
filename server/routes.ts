import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from 'multer';
import session from 'express-session';
import { isAuthenticated, isSameOrganization, isAdmin, AuthRequest } from './middleware/auth';
import * as authController from './controllers/authController';
import * as organizationController from './controllers/organizationController';
import * as userController from './controllers/userController';
import * as industryController from './controllers/industryController';
import * as templateController from './controllers/templateController';
import * as noticeController from './controllers/noticeController';
import * as dprController from './controllers/dprController';
import * as requestPageController from './controllers/requestPageController';
import * as grievanceController from './controllers/grievanceController';
import * as complianceDocumentController from './controllers/complianceDocumentController';
import { requestStatusController } from './controllers/requestStatusController';

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session
  app.use(
    session({
      secret: 'complyark-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
    })
  );
  
  // Configure multer for file uploads
  const storage = multer.memoryStorage();
  const upload = multer({ storage });
  
  // Authentication routes
  app.post('/api/auth/login', authController.login);
  app.post('/api/auth/logout', authController.logout);
  app.get('/api/auth/me', isAuthenticated, authController.getCurrentUser);
  
  // Organization routes
  app.get('/api/organizations', isAuthenticated, organizationController.listOrganizations);
  app.get('/api/organizations/:id', isAuthenticated, organizationController.getOrganization);
  app.post('/api/organizations', isAuthenticated, isAdmin, organizationController.createOrganization);
  app.put('/api/organizations/:id', isAuthenticated, isAdmin, organizationController.updateOrganization);
  app.delete('/api/organizations/:id', isAuthenticated, isAdmin, organizationController.deleteOrganization);
  app.get('/api/organizations/:orgId/users', isAuthenticated, isSameOrganization, organizationController.getOrganizationUsers);
  
  // User routes
  app.get('/api/users', isAuthenticated, isAdmin, userController.listUsers);
  app.get('/api/users/:id', isAuthenticated, userController.getUser);
  app.post('/api/users', isAuthenticated, isAdmin, userController.createUser);
  app.put('/api/users/:id', isAuthenticated, userController.updateUser);
  app.delete('/api/users/:id', isAuthenticated, isAdmin, userController.deleteUser);
  
  // Industry routes
  app.get('/api/industries', isAuthenticated, industryController.listIndustries);
  app.get('/api/industries/:id', isAuthenticated, industryController.getIndustry);
  app.post('/api/industries', isAuthenticated, isAdmin, industryController.createIndustry);
  app.put('/api/industries/:id', isAuthenticated, isAdmin, industryController.updateIndustry);
  app.delete('/api/industries/:id', isAuthenticated, isAdmin, industryController.deleteIndustry);
  
  // Template routes
  app.get('/api/templates', isAuthenticated, templateController.listTemplates);
  app.get('/api/templates/industry/:industryId', isAuthenticated, templateController.getTemplatesByIndustry);
  app.get('/api/templates/:id', isAuthenticated, templateController.getTemplate);
  app.post('/api/templates', isAuthenticated, isAdmin, upload.single('templateFile'), templateController.createTemplate);
  app.put('/api/templates/:id', isAuthenticated, isAdmin, upload.single('templateFile'), templateController.updateTemplate);
  app.delete('/api/templates/:id', isAuthenticated, isAdmin, templateController.deleteTemplate);
  app.get('/api/templates/:id/download', isAuthenticated, templateController.downloadTemplate);
  
  // Notice routes
  app.get('/api/organizations/:orgId/notices', isAuthenticated, isSameOrganization, noticeController.listNotices);
  app.get('/api/organizations/:orgId/notices/:noticeId', isAuthenticated, isSameOrganization, noticeController.getNotice);
  app.post('/api/organizations/:orgId/notices', isAuthenticated, isSameOrganization, noticeController.createNotice);
  app.get('/api/organizations/:orgId/notices/:noticeId/download', isAuthenticated, isSameOrganization, noticeController.downloadNotice);
  app.post('/api/organizations/:orgId/notices/:noticeId/translate', isAuthenticated, isSameOrganization, noticeController.translateNotice);
  app.get('/api/organizations/:orgId/notices/:noticeId/translations', isAuthenticated, isSameOrganization, noticeController.getTranslatedNotices);
  app.get('/api/organizations/:orgId/notices/:noticeId/translations/:translationId/download', isAuthenticated, isSameOrganization, noticeController.downloadTranslatedNotice);
  
  // DPR routes
  app.get('/api/organizations/:orgId/dpr', isAuthenticated, isSameOrganization, dprController.listDPRequests);
  app.get('/api/dpr/:id', isAuthenticated, dprController.getDPRequest);
  app.get('/api/dpr/:id/history', isAuthenticated, dprController.getDPRequestHistory);
  app.put('/api/dpr/:id', isAuthenticated, dprController.updateDPRequest);
  app.patch('/api/dpr/:id', isAuthenticated, dprController.updateDPRequest);
  
  // Grievances routes - temporarily disabled until controller is fully implemented
  // app.get('/api/organizations/:orgId/grievances', isAuthenticated, isSameOrganization, grievanceController.listGrievances);
  // app.get('/api/grievances/:id', isAuthenticated, grievanceController.getGrievance);
  // app.get('/api/grievances/:id/history', isAuthenticated, grievanceController.getGrievanceHistory);
  // app.put('/api/grievances/:id', isAuthenticated, grievanceController.updateGrievance);
  // app.patch('/api/grievances/:id', isAuthenticated, grievanceController.updateGrievance);
  
  // Public DPR routes (no authentication)
  app.post('/api/public/request-otp', (req, res) => dprController.requestOTP(req, res));
  app.post('/api/public/verify-otp', (req, res) => dprController.verifyOTP(req, res));
  app.post('/api/public/dpr', (req, res) => dprController.createPublicDPRequest(req, res));
  
  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, (req, res) => dprController.getDashboardStats(req, res));
  app.get('/api/dashboard/activities', isAuthenticated, (req, res) => dprController.getRecentActivities(req, res));
  app.get('/api/dashboard/recent-requests', isAuthenticated, dprController.getRecentRequests);
  
  // Request Status routes (for admin)
  app.get('/api/request-statuses', isAuthenticated, requestStatusController.getRequestStatuses);
  app.get('/api/request-statuses/:id', isAuthenticated, requestStatusController.getRequestStatus);
  app.post('/api/request-statuses', isAuthenticated, isAdmin, requestStatusController.createRequestStatus);
  app.put('/api/request-statuses/:id', isAuthenticated, isAdmin, requestStatusController.updateRequestStatus);
  app.delete('/api/request-statuses/:id', isAuthenticated, isAdmin, requestStatusController.deleteRequestStatus);
  
  // Request Page URL Generation route (for organization management)
  app.post('/api/organizations/:organizationId/request-page-token', isAuthenticated, isAdmin, requestPageController.generateRequestPageToken);
  
  // External Request Page routes (no authentication)
  app.get('/api/request-page/:token', requestPageController.getRequestPageByToken);
  app.post('/api/request-page/:token/submit', requestPageController.submitRequest);
  app.get('/api/request-page/status', requestPageController.checkRequestStatus);
  
  // Grievance routes
  // Temporarily commenting out this route until controller is properly implemented
  // app.get('/api/organizations/:orgId/grievances', isAuthenticated, isSameOrganization, grievanceController.listGrievances);
  // Temporarily returning mock data for grievances list until storage is properly implemented
  app.get('/api/grievances', isAuthenticated, async (req, res) => {
    // Get user's organization ID from request
    const orgId = (req as AuthRequest).user!.organizationId;
    try {
      // Return empty array for now
      return res.status(200).json([]);
    } catch (error) {
      console.error("Error fetching grievances:", error);
      return res.status(500).json({ message: "Failed to fetch grievances" });
    }
  });
  
  // Temporarily comment out these routes until controller is properly implemented
  // app.get('/api/grievances/:id', isAuthenticated, grievanceController.getGrievance);
  // app.put('/api/grievances/:id', isAuthenticated, grievanceController.updateGrievance);
  // app.get('/api/grievances/:id/history', isAuthenticated, grievanceController.getGrievanceHistory);
  
  // Compliance Document routes
  // Temporarily commented out until controller is properly implemented
  // app.get('/api/organizations/:orgId/compliance-documents', isAuthenticated, isSameOrganization, complianceDocumentController.getComplianceDocuments);
  app.get('/api/compliance-documents', isAuthenticated, async (req, res) => {
    // Get user's organization ID from request
    const orgId = (req as AuthRequest).user!.organizationId;
    try {
      const documents = await storage.listComplianceDocuments(orgId);
      return res.status(200).json(documents);
    } catch (error) {
      console.error("Error fetching compliance documents:", error);
      return res.status(500).json({ message: "Failed to fetch compliance documents" });
    }
  });
  app.post('/api/organizations/:orgId/compliance-documents', isAuthenticated, isSameOrganization, complianceDocumentController.upload.single('document'), complianceDocumentController.uploadComplianceDocument);
  app.delete('/api/compliance-documents/:id', isAuthenticated, complianceDocumentController.deleteComplianceDocument);
  app.post('/api/organizations/:orgId/compliance-folders', isAuthenticated, isSameOrganization, complianceDocumentController.createFolder);
  
  const httpServer = createServer(app);

  return httpServer;
}
