import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertComplianceDocumentSchema } from '@shared/schema';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderPath = path.join(process.cwd(), 'uploads', 'compliance');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ storage: storage_config });

// Get all compliance documents for an organization
export const getComplianceDocuments = async (req: Request, res: Response) => {
  const orgId = parseInt(req.params.orgId);
  const folderPath = req.query.folderPath as string | undefined;
  
  if (isNaN(orgId)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }
  
  try {
    const documents = await storage.listComplianceDocuments(orgId, folderPath);
    return res.status(200).json(documents);
  } catch (error) {
    console.error("Get compliance documents error:", error);
    return res.status(500).json({ message: "An error occurred while fetching compliance documents" });
  }
};

// Upload a new compliance document
export const uploadComplianceDocument = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file was uploaded" });
  }
  
  const orgId = parseInt(req.params.orgId);
  
  if (isNaN(orgId)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }
  
  try {
    const documentData = insertComplianceDocumentSchema.parse({
      documentName: req.body.documentName || req.file.originalname,
      documentPath: req.file.path,
      documentType: path.extname(req.file.originalname).substring(1) || 'unknown',
      folderPath: req.body.folderPath || '/',
      uploadedBy: req.user!.id,
      organizationId: orgId
    });
    
    const document = await storage.createComplianceDocument(documentData);
    
    return res.status(201).json(document);
  } catch (error) {
    console.error("Upload compliance document error:", error);
    return res.status(500).json({ message: "An error occurred while uploading the document" });
  }
};

// Delete a compliance document
export const deleteComplianceDocument = async (req: Request, res: Response) => {
  const documentId = parseInt(req.params.id);
  
  if (isNaN(documentId)) {
    return res.status(400).json({ message: "Invalid document ID" });
  }
  
  try {
    const document = await storage.getComplianceDocument(documentId);
    
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    
    // Delete the file from disk
    if (fs.existsSync(document.documentPath)) {
      fs.unlinkSync(document.documentPath);
    }
    
    // Delete from database
    const deleted = await storage.deleteComplianceDocument(documentId);
    
    if (!deleted) {
      return res.status(500).json({ message: "Failed to delete document record" });
    }
    
    return res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete compliance document error:", error);
    return res.status(500).json({ message: "An error occurred while deleting the document" });
  }
};

// Create a new folder
export const createFolder = async (req: AuthRequest, res: Response) => {
  const orgId = parseInt(req.params.orgId);
  
  if (isNaN(orgId)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }
  
  if (!req.body.folderName) {
    return res.status(400).json({ message: "Folder name is required" });
  }
  
  try {
    const parentPath = req.body.parentPath || '/';
    const newFolderPath = path.join(parentPath, req.body.folderName);
    
    // Check if folder already exists in the database (as a path)
    const existingDocs = await storage.listComplianceDocuments(orgId, newFolderPath);
    
    if (existingDocs.length > 0) {
      return res.status(400).json({ message: "A folder with this name already exists" });
    }
    
    // Create a marker document to represent the folder
    const folderData = insertComplianceDocumentSchema.parse({
      documentName: req.body.folderName,
      documentPath: 'folder', // Just a marker, not a real path
      documentType: 'folder',
      folderPath: parentPath,
      uploadedBy: req.user!.id,
      organizationId: orgId
    });
    
    const folder = await storage.createComplianceDocument(folderData);
    
    return res.status(201).json(folder);
  } catch (error) {
    console.error("Create folder error:", error);
    return res.status(500).json({ message: "An error occurred while creating the folder" });
  }
};