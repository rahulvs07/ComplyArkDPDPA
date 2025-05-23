import { Request, Response } from 'express';
import { storage } from '../storage';
import { AuthRequest } from '../middleware/auth';
import { db } from '../db';
import { complianceDocuments, type ComplianceDocument } from '@shared/schema';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Define storage configuration for uploaded files
const uploadDir = path.join(process.cwd(), 'uploads', 'compliance-docs');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    cb(null, `${Date.now()}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File type filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept common document types
  const allowedFileTypes = [
    '.pdf', '.doc', '.docx', '.txt', '.rtf', '.xls', '.xlsx', 
    '.ppt', '.pptx', '.csv', '.png', '.jpg', '.jpeg', '.gif'
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only document and image files are allowed.'));
  }
};

// Configure multer upload
export const upload = multer({
  storage: storage_config,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max file size
});

/**
 * Get all compliance documents for an organization
 */
export const getComplianceDocuments = async (req: Request, res: Response) => {
  try {
    // Get organization ID from authenticated user
    const authReq = req as AuthRequest;
    const orgId = authReq.user?.organizationId;
    
    if (!orgId) {
      return res.status(400).json({ message: "Organization ID is required" });
    }
    
    // Get folder path from query parameter
    const folderPath = req.query.folder as string || '/';
    
    console.log(`Controller fetching documents for org: ${orgId}, path: ${folderPath}`);
    
    try {
      // First, check if the table exists
      const tableExists = await db.execute(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'complianceDocuments'
        );
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log("Table 'complianceDocuments' does not exist yet - creating it");
        return res.status(200).json([]);
      }
      
      // Direct database query to bypass storage interface issues
      const { rows } = await db.execute(`
        SELECT * FROM "complianceDocuments" 
        WHERE "organizationId" = $1 AND "folderPath" = $2
        ORDER BY 
          CASE WHEN "documentType" = 'folder' THEN 0 ELSE 1 END, 
          "documentName" ASC
      `, [orgId, folderPath]);
      
      console.log(`SQL query returned ${rows.length} documents for org ${orgId} in path ${folderPath}`);
      
      // If we got no documents and this is the root folder, create default folders
      if (rows.length === 0 && folderPath === '/') {
        console.log("Creating default folders for organization");
        
        const defaultFolders = ['Notices', 'Translated Notices', 'Other Templates'];
        const currentUser = authReq.user?.id || 999; // Use logged in user ID or fallback to system admin
        
        for (const folderName of defaultFolders) {
          await db.execute(`
            INSERT INTO "complianceDocuments" 
            ("organizationId", "documentName", "documentType", "documentPath", "folderPath", "uploadedBy", "uploadedAt")
            VALUES ($1, $2, 'folder', '', '/', $3, NOW())
            ON CONFLICT DO NOTHING
          `, [orgId, folderName, currentUser]);
        }
        
        // Fetch again after creating defaults
        const { rows: newRows } = await db.execute(`
          SELECT * FROM "complianceDocuments" 
          WHERE "organizationId" = $1 AND "folderPath" = $2
          ORDER BY "documentName" ASC
        `, [orgId, folderPath]);
        
        // Map DB rows to ComplianceDocument objects
        const documents = newRows.map(row => ({
          documentId: row.documentId,
          documentName: row.documentName,
          documentType: row.documentType,
          documentPath: row.documentPath || '',
          uploadedBy: row.uploadedBy,
          uploadedAt: new Date(row.uploadedAt),
          organizationId: row.organizationId,
          folderPath: row.folderPath
        }));
        
        return res.status(200).json(documents);
      }
      
      // Map DB rows to ComplianceDocument objects
      const documents = rows.map(row => ({
        documentId: row.documentId,
        documentName: row.documentName,
        documentType: row.documentType,
        documentPath: row.documentPath || '',
        uploadedBy: row.uploadedBy,
        uploadedAt: new Date(row.uploadedAt),
        organizationId: row.organizationId,
        folderPath: row.folderPath
      }));
      
      return res.status(200).json(documents);
      
    } catch (dbError) {
      console.error("Database error fetching compliance documents:", dbError);
      return res.status(500).json({ 
        message: "Database error fetching compliance documents", 
        error: (dbError as Error).message 
      });
    }
  } catch (error) {
    console.error("Error in compliance document controller:", error);
    return res.status(500).json({ 
      message: "Failed to fetch compliance documents", 
      error: (error as Error).message 
    });
  }
};

/**
 * Upload a new compliance document
 */
export const uploadComplianceDocument = async (req: AuthRequest, res: Response) => {
  const orgId = parseInt(req.params.orgId);
  
  if (isNaN(orgId)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }
  
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  
  try {
    const { documentName, documentType, folderPath, description } = req.body;
    
    // Create document record in database
    const document = await storage.createComplianceDocument({
      organizationId: orgId,
      documentName: documentName || req.file.originalname,
      documentType: documentType || path.extname(req.file.originalname).substring(1),
      documentPath: req.file.path,
      folderPath: folderPath || '/',
      uploadedBy: req.user!.id
    });
    
    return res.status(201).json(document);
  } catch (error) {
    console.error("Error uploading compliance document:", error);
    
    // Clean up the file if there was an error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error removing file after failed upload:", err);
      });
    }
    
    return res.status(500).json({ message: "Failed to upload compliance document" });
  }
};

/**
 * Delete a compliance document
 */
export const deleteComplianceDocument = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid document ID" });
  }
  
  try {
    // Get document details to delete the file
    const document = await storage.getComplianceDocument(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    
    // Delete document from database
    const result = await storage.deleteComplianceDocument(id);
    if (!result) {
      return res.status(500).json({ message: "Failed to delete document record" });
    }
    
    // Delete the file from disk
    if (document.filePath) {
      fs.unlink(document.filePath, (err) => {
        if (err) {
          console.error("Error removing file:", err);
          // Still return success as the database record was deleted
        }
      });
    }
    
    return res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting compliance document:", error);
    return res.status(500).json({ message: "Failed to delete compliance document" });
  }
};

/**
 * Create a new folder for compliance documents
 */
export const createFolder = async (req: AuthRequest, res: Response) => {
  const orgId = parseInt(req.params.orgId);
  
  if (isNaN(orgId)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }
  
  try {
    const { folderName, parentFolder } = req.body;
    
    if (!folderName) {
      return res.status(400).json({ message: "Folder name is required" });
    }
    
    // Sanitize folder name to prevent path traversal
    const sanitizedFolderName = folderName.replace(/[^\w\s-]/g, '');
    
    // Create the folder path
    const folderPath = parentFolder ? 
      `${parentFolder.endsWith('/') ? parentFolder : parentFolder + '/'}${sanitizedFolderName}` : 
      `/${sanitizedFolderName}`;
    
    // Create a placeholder document for the folder
    // Create the folder with correct path parameters
    const folder = await storage.createComplianceDocument({
      organizationId: orgId,
      documentName: sanitizedFolderName,
      documentType: 'folder',
      documentPath: '',
      folderPath: parentFolder || '/',
      uploadedBy: req.user!.id
    });
    
    return res.status(201).json(folder);
  } catch (error) {
    console.error("Error creating folder:", error);
    return res.status(500).json({ message: "Failed to create folder" });
  }
};