import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { storage } from '../storage';
import { insertNoticeSchema, insertTranslatedNoticeSchema } from '@shared/schema';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Directories for notice files
const NOTICES_DIR = path.join(process.cwd(), 'NoticesGenerated');
const TRANSLATED_NOTICES_DIR = path.join(process.cwd(), 'NoticesTranslated');

// Ensure directories exist
if (!fs.existsSync(NOTICES_DIR)) {
  fs.mkdirSync(NOTICES_DIR, { recursive: true });
}

if (!fs.existsSync(TRANSLATED_NOTICES_DIR)) {
  fs.mkdirSync(TRANSLATED_NOTICES_DIR, { recursive: true });
}

// Get all notices for an organization
export const listNotices = async (req: AuthRequest, res: Response) => {
  const orgId = parseInt(req.params.orgId);
  
  if (isNaN(orgId)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }
  
  try {
    const notices = await storage.listNotices(orgId);
    
    // Get creator info for each notice
    const noticesWithCreator = await Promise.all(
      notices.map(async (notice) => {
        const creator = await storage.getUser(notice.createdBy);
        return {
          ...notice,
          creatorName: creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown User'
        };
      })
    );
    
    return res.status(200).json(noticesWithCreator);
  } catch (error) {
    console.error("List notices error:", error);
    return res.status(500).json({ message: "An error occurred while fetching notices" });
  }
};

// Get one notice
export const getNotice = async (req: AuthRequest, res: Response) => {
  const orgId = parseInt(req.params.orgId);
  const noticeId = parseInt(req.params.noticeId);
  
  if (isNaN(orgId) || isNaN(noticeId)) {
    return res.status(400).json({ message: "Invalid ID parameters" });
  }
  
  try {
    const notice = await storage.getNotice(noticeId);
    
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }
    
    // Verify organization matches
    if (notice.organizationId !== orgId) {
      return res.status(403).json({ message: "Notice does not belong to this organization" });
    }
    
    const creator = await storage.getUser(notice.createdBy);
    
    return res.status(200).json({
      ...notice,
      creatorName: creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown User'
    });
  } catch (error) {
    console.error("Get notice error:", error);
    return res.status(500).json({ message: "An error occurred while fetching the notice" });
  }
};

// Create notice
export const createNotice = async (req: AuthRequest, res: Response) => {
  const orgId = parseInt(req.params.orgId);
  
  if (isNaN(orgId)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }
  
  try {
    // Validate request body
    const validatedData = insertNoticeSchema.parse({
      ...req.body,
      organizationId: orgId,
      createdBy: req.user.id
    });
    
    // Check for versioning if same notice name exists
    let noticeName = validatedData.noticeName;
    const existingNotices = await storage.listNotices(orgId);
    
    // Check for existing notice with similar name to set version
    const similarNameNotices = existingNotices.filter(n => 
      n.noticeName.startsWith(noticeName) || n.noticeName === noticeName
    );
    
    if (similarNameNotices.length > 0) {
      // Extract highest version number
      let highestVersion = 0;
      similarNameNotices.forEach(n => {
        const versionMatch = n.noticeName.match(/_V(\d+)$/);
        if (versionMatch) {
          const version = parseInt(versionMatch[1]);
          if (version > highestVersion) {
            highestVersion = version;
          }
        }
      });
      
      // Set next version
      noticeName = `${noticeName}_V${highestVersion + 1}`;
    }
    
    // Create organization-specific directory
    const orgDir = path.join(NOTICES_DIR, orgId.toString());
    if (!fs.existsSync(orgDir)) {
      fs.mkdirSync(orgDir, { recursive: true });
    }
    
    // Generate PDF or use placeholder
    const pdfFileName = `${noticeName.replace(/\s+/g, '_')}.pdf`;
    const pdfPath = path.join(orgDir, pdfFileName);
    
    // Generate a simple text file as PDF placeholder
    // In a real implementation, we would use a library like puppeteer to generate a PDF
    fs.writeFileSync(pdfPath, validatedData.noticeBody);
    
    // Create the notice
    const notice = await storage.createNotice({
      ...validatedData,
      noticeName,
      folderLocation: pdfPath
    });
    
    const creator = await storage.getUser(notice.createdBy);
    
    return res.status(201).json({
      ...notice,
      creatorName: creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown User'
    });
  } catch (error) {
    console.error("Create notice error:", error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: "Invalid notice data", errors: error.errors });
    }
    return res.status(500).json({ message: "An error occurred while creating the notice" });
  }
};

// Download notice file
export const downloadNotice = async (req: AuthRequest, res: Response) => {
  const orgId = parseInt(req.params.orgId);
  const noticeId = parseInt(req.params.noticeId);
  
  if (isNaN(orgId) || isNaN(noticeId)) {
    return res.status(400).json({ message: "Invalid ID parameters" });
  }
  
  try {
    const notice = await storage.getNotice(noticeId);
    
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }
    
    // Verify organization matches
    if (notice.organizationId !== orgId) {
      return res.status(403).json({ message: "Notice does not belong to this organization" });
    }
    
    if (!notice.folderLocation || !fs.existsSync(notice.folderLocation)) {
      return res.status(404).json({ message: "Notice file not found" });
    }
    
    const fileContent = fs.readFileSync(notice.folderLocation);
    const fileName = path.basename(notice.folderLocation);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    return res.send(fileContent);
  } catch (error) {
    console.error("Download notice error:", error);
    return res.status(500).json({ message: "An error occurred while downloading the notice" });
  }
};

// Translate notice
export const translateNotice = async (req: AuthRequest, res: Response) => {
  const orgId = parseInt(req.params.orgId);
  const noticeId = parseInt(req.params.noticeId);
  
  if (isNaN(orgId) || isNaN(noticeId)) {
    return res.status(400).json({ message: "Invalid ID parameters" });
  }
  
  const { targetLanguageCodes } = req.body;
  
  if (!targetLanguageCodes || !Array.isArray(targetLanguageCodes) || targetLanguageCodes.length === 0) {
    return res.status(400).json({ message: "Target language codes are required" });
  }
  
  try {
    const notice = await storage.getNotice(noticeId);
    
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }
    
    // Verify organization matches
    if (notice.organizationId !== orgId) {
      return res.status(403).json({ message: "Notice does not belong to this organization" });
    }
    
    // Create organization-specific directory for translated notices
    const orgTranslationDir = path.join(TRANSLATED_NOTICES_DIR, orgId.toString());
    if (!fs.existsSync(orgTranslationDir)) {
      fs.mkdirSync(orgTranslationDir, { recursive: true });
    }
    
    const translatedNotices = [];
    
    // Process each target language
    for (const langCode of targetLanguageCodes) {
      // Simple language mapping for display
      const languageMapping = {
        'asm_Beng': 'Assamese',
        'ben_Beng': 'Bengali',
        'guj_Gujr': 'Gujarati',
        'hin_Deva': 'Hindi',
        'kan_Knda': 'Kannada',
        'mal_Mlym': 'Malayalam',
        'mar_Deva': 'Marathi',
        'ori_Orya': 'Oriya',
        'pan_Guru': 'Punjabi',
        'tam_Taml': 'Tamil',
        'tel_Telu': 'Telugu'
      };
      
      // For the demo, we'll create a simple translated text
      // In a real implementation, this would call the IndicTrans2 model
      const translatedText = `${notice.noticeBody}_translated_to_${langCode}`;
      
      const fileName = `${notice.noticeName.replace(/\s+/g, '_')}_${langCode}.pdf`;
      const filePath = path.join(orgTranslationDir, fileName);
      
      // Write translated text to file
      fs.writeFileSync(filePath, translatedText);
      
      // Create translated notice record
      const translatedNotice = await storage.createTranslatedNotice({
        noticeId: notice.noticeId,
        language: languageMapping[langCode] || langCode,
        translatedBody: translatedText,
        filePath
      });
      
      translatedNotices.push({
        ...translatedNotice,
        languageCode: langCode,
        languageName: languageMapping[langCode] || langCode
      });
    }
    
    return res.status(200).json({
      noticeId: notice.noticeId,
      noticeName: notice.noticeName,
      translatedNotices
    });
  } catch (error) {
    console.error("Translate notice error:", error);
    return res.status(500).json({ message: "An error occurred while translating the notice" });
  }
};

// Get translated notices for a notice
export const getTranslatedNotices = async (req: AuthRequest, res: Response) => {
  const orgId = parseInt(req.params.orgId);
  const noticeId = parseInt(req.params.noticeId);
  
  if (isNaN(orgId) || isNaN(noticeId)) {
    return res.status(400).json({ message: "Invalid ID parameters" });
  }
  
  try {
    const notice = await storage.getNotice(noticeId);
    
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }
    
    // Verify organization matches
    if (notice.organizationId !== orgId) {
      return res.status(403).json({ message: "Notice does not belong to this organization" });
    }
    
    const translatedNotices = await storage.listTranslatedNotices(noticeId);
    
    return res.status(200).json(translatedNotices);
  } catch (error) {
    console.error("Get translated notices error:", error);
    return res.status(500).json({ message: "An error occurred while fetching translated notices" });
  }
};

// Download translated notice
export const downloadTranslatedNotice = async (req: AuthRequest, res: Response) => {
  const orgId = parseInt(req.params.orgId);
  const noticeId = parseInt(req.params.noticeId);
  const translationId = parseInt(req.params.translationId);
  
  if (isNaN(orgId) || isNaN(noticeId) || isNaN(translationId)) {
    return res.status(400).json({ message: "Invalid ID parameters" });
  }
  
  try {
    const notice = await storage.getNotice(noticeId);
    
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }
    
    // Verify organization matches
    if (notice.organizationId !== orgId) {
      return res.status(403).json({ message: "Notice does not belong to this organization" });
    }
    
    const translatedNotice = await storage.getTranslatedNotice(translationId);
    
    if (!translatedNotice || translatedNotice.noticeId !== noticeId) {
      return res.status(404).json({ message: "Translated notice not found" });
    }
    
    if (!translatedNotice.filePath || !fs.existsSync(translatedNotice.filePath)) {
      return res.status(404).json({ message: "Translated notice file not found" });
    }
    
    const fileContent = fs.readFileSync(translatedNotice.filePath);
    const fileName = path.basename(translatedNotice.filePath);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    return res.send(fileContent);
  } catch (error) {
    console.error("Download translated notice error:", error);
    return res.status(500).json({ message: "An error occurred while downloading the translated notice" });
  }
};
