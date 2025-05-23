import { Request, Response } from 'express';
import { storage } from '../storage';
import { AuthRequest } from '../middleware/auth';
import { db, pool } from '../db';
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
const multerDiskStorage = multer.diskStorage({
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
  storage: multerDiskStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max file size
});

/**
 * Get all compliance documents for an organization
 */
export const getComplianceDocuments = async (req: Request, res: Response) => {
  try {
    console.log("Compliance document controller called!");
    
    // Get organization ID from authenticated user
    const authReq = req as AuthRequest;
    const orgId = authReq.user?.organizationId;
    
    if (!orgId) {
      console.log("No organization ID in user object:", authReq.user);
      return res.status(200).json([]); // Return empty array rather than error
    }
    
    // Get folder path from query parameter and normalize it
    let folderPath = req.query.folder as string || '/';
    
    console.log(`Original folder path from request: '${folderPath}'`);
    
    // Normalize the folder path to ensure consistent handling
    if (!folderPath.startsWith('/')) {
      folderPath = `/${folderPath}`;
    }
    
    if (!folderPath.endsWith('/')) {
      folderPath = `${folderPath}/`;
    }
    
    // Remove any double slashes that might cause issues
    while (folderPath.includes('//')) {
      folderPath = folderPath.replace('//', '/');
    }
    
    // Important: Make sure we decode any URL encoding to get the actual path
    folderPath = decodeURIComponent(folderPath);
    console.log(`Decoded and normalized folder path: '${folderPath}'`);
    
    console.log(`Controller fetching documents for org: ${orgId}, path: '${folderPath}'`);
    
    // Find a valid user ID for this organization (needed for default folders)
    let validUserId = authReq.user?.id || 1;
    
    // Generate default folders as a fallback
    const defaultFolders = [
      {
        documentId: -1,
        documentName: "Notices",
        documentType: "folder",
        documentPath: "",
        uploadedBy: validUserId,
        uploadedAt: new Date(),
        organizationId: orgId,
        folderPath: folderPath,
        uploadedByName: "System"
      },
      {
        documentId: -2,
        documentName: "Translated Notices",
        documentType: "folder",
        documentPath: "",
        uploadedBy: validUserId,
        uploadedAt: new Date(),
        organizationId: orgId,
        folderPath: folderPath,
        uploadedByName: "System"
      },
      {
        documentId: -3,
        documentName: "Other Templates",
        documentType: "folder",
        documentPath: "",
        uploadedBy: validUserId,
        uploadedAt: new Date(),
        organizationId: orgId,
        folderPath: folderPath,
        uploadedByName: "System"
      }
    ];
    
    // Create the table if it doesn't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "complianceDocuments" (
          "documentId" SERIAL PRIMARY KEY,
          "documentName" VARCHAR(255) NOT NULL,
          "documentType" VARCHAR(50) NOT NULL,
          "documentPath" TEXT,
          "folderPath" VARCHAR(255) NOT NULL DEFAULT '/',
          "uploadedBy" INTEGER NOT NULL,
          "organizationId" INTEGER NOT NULL,
          "uploadedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
      console.log("Ensured complianceDocuments table exists");
    } catch (createError) {
      console.error("Error creating table:", createError);
      return res.status(200).json(defaultFolders);
    }
    
    // Fetch documents from database
    try {
      const query = `
        SELECT *, 
        (SELECT username FROM users WHERE id = "uploadedBy" LIMIT 1) as "uploadedByName",
        (SELECT LENGTH(CAST("documentPath" AS BYTEA)) FROM "complianceDocuments" doc2 WHERE doc2."documentId" = "complianceDocuments"."documentId") as "fileSize"
        FROM "complianceDocuments" 
        WHERE "organizationId" = $1 AND "folderPath" = $2
        ORDER BY 
          CASE WHEN "documentType" = 'folder' THEN 0 ELSE 1 END, 
          "documentName" ASC
      `;
      
      console.log(`Executing query for org: ${orgId}, path: '${folderPath}'`);
      const result = await pool.query(query, [orgId, folderPath]);
      
      // If no documents found in root, create default folders
      if ((!result.rows || result.rows.length === 0) && folderPath === '/') {
        console.log("No documents found for organization, creating default folders");
        
        try {
          // Create default folders if they don't exist
          for (const folder of defaultFolders) {
            await pool.query(`
              INSERT INTO "complianceDocuments" 
              ("documentName", "documentType", "documentPath", "folderPath", "uploadedBy", "organizationId", "uploadedAt")
              VALUES ($1, $2, $3, $4, $5, $6, NOW())
              ON CONFLICT DO NOTHING
            `, [
              folder.documentName,
              'folder',
              '',
              '/',
              validUserId,
              orgId
            ]);
          }
          
          // Fetch the newly created folders
          const newResult = await pool.query(`
            SELECT * FROM "complianceDocuments" 
            WHERE "organizationId" = $1 AND "folderPath" = $2
            ORDER BY "documentName" ASC
          `, [orgId, folderPath]);
          
          if (newResult.rows && newResult.rows.length > 0) {
            // Map DB rows to ComplianceDocument objects
            const documents = newResult.rows.map((row: any) => ({
              documentId: Number(row.documentId),
              documentName: String(row.documentName || ''),
              documentType: String(row.documentType || 'folder'),
              documentPath: String(row.documentPath || ''),
              uploadedBy: Number(row.uploadedBy),
              uploadedAt: new Date(row.uploadedAt),
              organizationId: Number(row.organizationId),
              folderPath: String(row.folderPath || '/'),
              uploadedByName: row.uploadedByName || 'System',
              fileSize: row.fileSize || 0
            }));
            
            return res.status(200).json(documents);
          } else {
            // Still return default folders if database creation failed
            return res.status(200).json(defaultFolders);
          }
        } catch (createFolderError) {
          console.error("Error creating default folders:", createFolderError);
          return res.status(200).json(defaultFolders);
        }
      }
      
      if (!result.rows) {
        console.log("Database query did not return rows property");
        return res.status(200).json(folderPath === '/' ? defaultFolders : []);
      }
      
      // Map DB rows to ComplianceDocument objects with type safety
      const documents = result.rows.map((row: any) => ({
        documentId: Number(row.documentId),
        documentName: String(row.documentName || ''),
        documentType: String(row.documentType || 'file'),
        documentPath: String(row.documentPath || ''),
        uploadedBy: Number(row.uploadedBy),
        uploadedAt: new Date(row.uploadedAt || new Date()),
        organizationId: Number(row.organizationId),
        folderPath: String(row.folderPath || '/'),
        uploadedByName: row.uploadedByName || 'Unknown',
        fileSize: row.fileSize || 0
      }));
      
      return res.status(200).json(documents);
    } catch (error) {
      console.error("Database error fetching compliance documents:", error);
      // Return default folders instead of error for root folder
      if (folderPath === '/') {
        return res.status(200).json(defaultFolders);
      }
      return res.status(200).json([]);
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
    const { documentName, documentType, folderPath } = req.body;
    let validUserId = req.user?.id || 1;
    
    // Ensure table exists
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "complianceDocuments" (
          "documentId" SERIAL PRIMARY KEY,
          "documentName" VARCHAR(255) NOT NULL,
          "documentType" VARCHAR(50) NOT NULL,
          "documentPath" TEXT,
          "folderPath" VARCHAR(255) NOT NULL DEFAULT '/',
          "uploadedBy" INTEGER NOT NULL,
          "organizationId" INTEGER NOT NULL,
          "uploadedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
    } catch (tableError) {
      console.error("Error ensuring table exists:", tableError);
    }
    
    // Prepare and execute the insert query
    const query = `
      INSERT INTO "complianceDocuments" 
      ("documentName", "documentType", "documentPath", "uploadedBy", "organizationId", "folderPath", "uploadedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
      RETURNING *
    `;
    
    console.log("Running upload query:", query);
    
    const values = [
      documentName || req.file.originalname,
      documentType || path.extname(req.file.originalname).substring(1) || 'plain',
      req.file.path,
      validUserId,
      orgId,
      folderPath || '/'
    ];
    
    const result = await pool.query(query, values);
    
    if (result.rows && result.rows.length > 0) {
      const document = result.rows[0];
      
      return res.status(201).json({
        documentId: document.documentId,
        documentName: document.documentName,
        documentType: document.documentType,
        documentPath: document.documentPath,
        uploadedBy: document.uploadedBy,
        uploadedAt: document.uploadedAt,
        organizationId: document.organizationId,
        folderPath: document.folderPath
      });
    } else {
      throw new Error("Document upload failed - no record created");
    }
  } catch (error) {
    console.error('Upload failed:', error);
    return res.status(500).json({ 
      message: "Failed to upload document", 
      error: (error as Error).message 
    });
  }
};

/**
 * Delete a compliance document
 */
export const deleteComplianceDocument = async (req: Request, res: Response) => {
  const { documentId } = req.params;
  
  if (!documentId) {
    return res.status(400).json({ message: "Document ID is required" });
  }
  
  try {
    // Get document info first to retrieve file path
    const getResult = await pool.query(
      'SELECT * FROM "complianceDocuments" WHERE "documentId" = $1',
      [documentId]
    );
    
    if (!getResult.rows || getResult.rows.length === 0) {
      return res.status(404).json({ message: "Document not found" });
    }
    
    const document = getResult.rows[0];
    
    // Delete from database
    const deleteResult = await pool.query(
      'DELETE FROM "complianceDocuments" WHERE "documentId" = $1 RETURNING *',
      [documentId]
    );
    
    if (!deleteResult.rows || deleteResult.rows.length === 0) {
      return res.status(404).json({ message: "Document not found or already deleted" });
    }
    
    // If it's a file (not a folder), also delete the physical file
    if (document.documentType !== 'folder' && document.documentPath) {
      try {
        if (fs.existsSync(document.documentPath)) {
          fs.unlinkSync(document.documentPath);
        }
      } catch (fileError) {
        console.error("Error deleting physical file:", fileError);
        // Continue execution - the database entry is more important
      }
    }
    
    return res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error('Delete failed:', error);
    return res.status(500).json({ 
      message: "Failed to delete document",
      error: (error as Error).message
    });
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
  
  const { folderName, parentFolder } = req.body;
  
  if (!folderName) {
    return res.status(400).json({ message: "Folder name is required" });
  }
  
  console.log(`Folder creation endpoint called with:`, {
    folderName,
    parentFolder
  });
  
  try {
    // Normalize the parent folder path
    let normalizedParentFolder = parentFolder || '/';
    if (!normalizedParentFolder.endsWith('/')) {
      normalizedParentFolder += '/';
    }
    
    // Create the table if it doesn't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "complianceDocuments" (
          "documentId" SERIAL PRIMARY KEY,
          "documentName" VARCHAR(255) NOT NULL,
          "documentType" VARCHAR(50) NOT NULL,
          "documentPath" TEXT,
          "folderPath" VARCHAR(255) NOT NULL DEFAULT '/',
          "uploadedBy" INTEGER NOT NULL,
          "organizationId" INTEGER NOT NULL,
          "uploadedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
      console.log("Ensured complianceDocuments table exists");
    } catch (createError) {
      console.error("Error creating table:", createError);
    }
    
    let validUserId = req.user?.id || 1;
    
    console.log(`Creating folder "${folderName}" in parent folder "${normalizedParentFolder}"`);
    
    // Insert the folder
    const query = `
      INSERT INTO "complianceDocuments" 
      ("documentName", "documentType", "documentPath", "uploadedBy", "organizationId", "folderPath", "uploadedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
      RETURNING *
    `;
    
    console.log("Running query:", query);
    
    const result = await pool.query(query, [
      folderName,
      'folder',
      '',
      validUserId,
      orgId,
      normalizedParentFolder
    ]);
    
    if (result.rows && result.rows.length > 0) {
      const folder = result.rows[0];
      
      return res.status(201).json({
        documentId: folder.documentId,
        documentName: folder.documentName,
        documentType: 'folder',
        documentPath: '',
        uploadedBy: folder.uploadedBy,
        uploadedAt: folder.uploadedAt,
        organizationId: folder.organizationId,
        folderPath: folder.folderPath
      });
    } else {
      throw new Error("Folder creation failed - no record created");
    }
  } catch (error) {
    console.error('Folder creation failed:', error);
    return res.status(500).json({ 
      message: "Failed to create folder", 
      error: (error as Error).message 
    });
  }
};