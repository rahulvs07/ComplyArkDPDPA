import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { storage } from '../storage';
import { insertNoticeSchema, insertTranslatedNoticeSchema } from '@shared/schema';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

const execPromise = promisify(exec);

// Directories for notice files
const NOTICES_DIR = path.join(process.cwd(), 'NoticesGenerated');
const TRANSLATED_NOTICES_DIR = path.join(process.cwd(), 'NoticesTranslated');

// Helper function to generate DOCX document from notice content
async function generateDocxNotice(
  noticeContent: string, 
  outputPath: string, 
  noticeName: string = "Privacy Notice", 
  organizationName: string = "ComplyArk",
  organizationAddress: string = "",
  requestPageUrlToken: string | null = null
): Promise<void> {
  try {
    // Get current date for footer
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Generate a unique document ID
    const documentId = `CA-${Math.floor(Math.random() * 10000)}-${new Date().getFullYear()}`;
    
    // Create a new document with professional styling
    const doc = new Document({
      styles: {
        paragraphStyles: [
          {
            id: "Normal",
            name: "Normal",
            run: {
              font: "Calibri",
              size: 24, // 12pt
              color: "333333"
            },
            paragraph: {
              spacing: {
                line: 360, // 1.5 line spacing
                before: 120, // 6pt before
                after: 120 // 6pt after
              }
            }
          },
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            run: {
              font: "Calibri",
              size: 32, // 16pt
              bold: true,
              color: "1E5B8D"
            },
            paragraph: {
              spacing: {
                before: 240, // 12pt before
                after: 120 // 6pt after
              }
            }
          },
          {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            run: {
              font: "Calibri",
              size: 26, // 13pt
              bold: true,
              color: "2E77AE"
            },
            paragraph: {
              spacing: {
                before: 240, // 12pt before
                after: 120 // 6pt after
              }
            }
          },
          {
            id: "Header",
            name: "Header",
            basedOn: "Normal",
            run: {
              font: "Calibri",
              size: 20, // 10pt
              color: "FFFFFF"
            }
          },
          {
            id: "Footer",
            name: "Footer",
            basedOn: "Normal",
            run: {
              font: "Calibri",
              size: 18, // 9pt
              color: "666666"
            },
            paragraph: {
              alignment: "center"
            }
          }
        ]
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440, // 1 inch
              bottom: 1440, // 1 inch
              left: 1440, // 1 inch
            },
          },
        },
        headers: {
          default: {
            children: [
              new Paragraph({
                style: "Header",
                alignment: "center",
                children: [
                  new TextRun({
                    text: organizationName,
                    bold: true,
                    size: 24, // 12pt
                    color: "FFFFFF"
                  }),
                ],
                shading: {
                  type: "solid",
                  color: "2E77AE",
                },
                border: {
                  bottom: {
                    color: "EEEEEE",
                    size: 6,
                    style: "single",
                  },
                },
                spacing: {
                  after: 200,
                },
              }),
              // Add organization address if available
              ...(organizationAddress ? [
                new Paragraph({
                  style: "Header",
                  alignment: "left",
                  children: [
                    new TextRun({
                      text: organizationAddress,
                      size: 20, // 10pt
                      color: "666666"
                    }),
                  ],
                  spacing: {
                    after: 120,
                  },
                })
              ] : []),
              new Paragraph({
                style: "Header",
                alignment: "right",
                children: [
                  new TextRun({
                    text: `Document ID: ${documentId}`,
                    size: 16, // 8pt
                    color: "AAAAAA"
                  }),
                ],
              }),
            ],
          },
        },
        footers: {
          default: {
            children: [
              new Paragraph({
                style: "Footer",
                alignment: "center",
                children: [
                  new TextRun({
                    text: `© ${new Date().getFullYear()} ${organizationName}. All rights reserved.`,
                  }),
                ],
              }),
              new Paragraph({
                style: "Footer",
                alignment: "center",
                children: [
                  new TextRun({
                    text: `Last updated: ${currentDate}`,
                  }),
                ],
              }),
              new Paragraph({
                style: "Footer",
                alignment: "center",
                children: [
                  new TextRun({
                    text: "This document is generated and managed by ComplyArk Compliance Management System.",
                    size: 16, // 8pt
                  }),
                ],
              }),
              // Add request URL information in the footer if available
              ...(requestPageUrlToken ? [
                new Paragraph({
                  style: "Footer",
                  alignment: "center",
                  children: [
                    new TextRun({
                      text: `Submit data requests at: `,
                      size: 16, // 8pt
                    }),
                    new TextRun({
                      text: `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'complyark.replit.app'}/request/${requestPageUrlToken}`,
                      size: 16, // 8pt
                      color: "2E77AE",
                      underline: true
                    }),
                  ],
                }),
              ] : []),
            ],
          },
        },
        children: [
          new Paragraph({
            style: "Heading1",
            alignment: "center",
            children: [
              new TextRun({
                text: noticeName,
                bold: true,
                size: 36, // 18pt
                color: "2E77AE"
              }),
            ],
            spacing: {
              before: 240,
              after: 240,
            }
          }),
          new Paragraph({
            text: ""
          }),
          // Process notice content by paragraphs with section formatting
          ...processNoticeContent(noticeContent),
          
          // Add request URL if available
          ...(requestPageUrlToken ? [
            new Paragraph({
              text: "",
              spacing: { before: 360, after: 120 }
            }),
            new Paragraph({
              style: "Heading2",
              children: [
                new TextRun({
                  text: "Submit Your Data Protection Requests",
                  bold: true,
                })
              ],
              spacing: { before: 240, after: 120 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "You can submit data protection requests through our dedicated portal at:"
                })
              ],
              spacing: { before: 120, after: 120 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'complyark.replit.app'}/request/${requestPageUrlToken}`,
                  color: "2E77AE",
                  underline: true
                })
              ],
              spacing: { before: 120, after: 120 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Use this portal to exercise your rights regarding your personal data, including access, correction, or erasure requests."
                })
              ],
              spacing: { before: 120, after: 240 }
            })
          ] : [])
        ],
      }],
    });

    // Generate the DOCX file
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
  } catch (error) {
    console.error("Error generating DOCX document:", error);
    // Create a simple text file as fallback
    fs.writeFileSync(outputPath, noticeContent);
  }
}

// Helper function to process notice content into properly formatted paragraphs
function processNoticeContent(content: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = content.split('\n');
  
  let inList = false;
  let listItems: string[] = [];
  
  lines.forEach((line, index) => {
    // Check if line is a heading (e.g., starts with a number and period like "1. INFORMATION WE COLLECT")
    if (/^\d+\.?\s+[A-Z\s]+$/.test(line.trim())) {
      // If we were processing a list, add it before the new heading
      if (inList && listItems.length > 0) {
        // Add the list
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: "" })
            ],
            spacing: { before: 120, after: 120 }
          })
        );
        
        listItems.forEach(item => {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: "• " + item.trim() })
              ],
              indent: { left: 720 }, // 0.5 inch indent
              spacing: { before: 60, after: 60 }
            })
          );
        });
        
        inList = false;
        listItems = [];
      }
      
      // Add the heading
      paragraphs.push(
        new Paragraph({
          style: "Heading2",
          children: [
            new TextRun({
              text: line.trim(),
              bold: true,
            }),
          ],
          spacing: { before: 240, after: 120 }
        })
      );
    }
    // Check if line is a list item (starts with - or *)
    else if (/^\s*[-•*]\s+/.test(line)) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      
      // Extract the text without the bullet
      const itemText = line.replace(/^\s*[-•*]\s+/, '');
      listItems.push(itemText);
    }
    // Regular paragraph
    else {
      // If we were processing a list, add it before the new paragraph
      if (inList && listItems.length > 0 && line.trim() !== '') {
        // Add the list
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: "" })
            ],
            spacing: { before: 120, after: 120 }
          })
        );
        
        listItems.forEach(item => {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: "• " + item.trim() })
              ],
              indent: { left: 720 }, // 0.5 inch indent
              spacing: { before: 60, after: 60 }
            })
          );
        });
        
        inList = false;
        listItems = [];
      }
      
      // Skip empty lines
      if (line.trim() === '') {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: "" })
            ],
            spacing: { before: 120, after: 120 }
          })
        );
      } else {
        // Add the paragraph
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: line.trim() })
            ],
            spacing: { before: 60, after: 60 }
          })
        );
      }
    }
  });
  
  // If we end with a list, add it
  if (inList && listItems.length > 0) {
    // Add the list
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: "" })
        ],
        spacing: { before: 120, after: 120 }
      })
    );
    
    listItems.forEach(item => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "• " + item.trim() })
          ],
          indent: { left: 720 }, // 0.5 inch indent
          spacing: { before: 60, after: 60 }
        })
      );
    });
  }
  
  return paragraphs;
}

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
    
    // Generate PDF and DOCX files
    const baseName = `${noticeName.replace(/\s+/g, '_')}`;
    const pdfFileName = `${baseName}.pdf`;
    const docxFileName = `${baseName}.docx`;
    const pdfPath = path.join(orgDir, pdfFileName);
    const docxPath = path.join(orgDir, docxFileName);
    
    // Generate a simple text file as PDF placeholder
    // In a real implementation, we would use a library like puppeteer to generate a PDF
    fs.writeFileSync(pdfPath, validatedData.noticeBody);
    
    // Generate DOCX file using docx library
    await generateDocxNotice(validatedData.noticeBody, docxPath);
    
    // Create the notice
    const notice = await storage.createNotice({
      ...validatedData,
      noticeName,
      folderLocation: pdfPath
    });
    
    // Create notification for notice creation
    try {
      await storage.createNotification({
        userId: req.user.id,
        organizationId: orgId,
        module: 'Notice',
        action: 'Notice created',
        actionType: 'created',
        message: `A new notice "${noticeName}" has been created`,
        initiator: 'user',
        relatedItemId: notice.noticeId,
        relatedItemType: 'Notice'
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
      // Continue execution even if notification creation fails
    }
    
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
  const format = req.query.format as string || 'pdf';
  
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
    
    // Create temporary directory if it doesn't exist
    if (!fs.existsSync(NOTICES_DIR)) {
      fs.mkdirSync(NOTICES_DIR, { recursive: true });
    }
    
    // Handle format
    if (format === 'docx') {
      // Generate DOCX version of the notice
      const docxFilePath = path.join(NOTICES_DIR, `notice_${noticeId}_${Date.now()}.docx`);
      
      // Get organization info for the notice
      const organization = await storage.getOrganization(notice.organizationId);
      const orgName = organization ? organization.businessName : "ComplyArk";
      const orgAddress = organization ? organization.businessAddress : "";
      
      await generateDocxNotice(
        notice.noticeBody, 
        docxFilePath, 
        notice.noticeName, 
        orgName,
        orgAddress,
        organization?.requestPageUrlToken
      );
      
      const fileContent = fs.readFileSync(docxFilePath);
      const fileName = `${notice.noticeName.replace(/\s+/g, '_')}.docx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Send file and clean up
      res.send(fileContent);
      
      // Clean up temp file after sending
      setTimeout(() => {
        try {
          if (fs.existsSync(docxFilePath)) {
            fs.unlinkSync(docxFilePath);
          }
        } catch (cleanupError) {
          console.error("Error cleaning up temporary DOCX file:", cleanupError);
        }
      }, 5000);
      
      return;
    } else {
      // Default PDF format - use existing file or generate if needed
      if (!notice.folderLocation || !fs.existsSync(notice.folderLocation)) {
        return res.status(404).json({ message: "Notice file not found" });
      }
      
      const fileContent = fs.readFileSync(notice.folderLocation);
      const fileName = `${notice.noticeName.replace(/\s+/g, '_')}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      return res.send(fileContent);
    }
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
        organizationId: notice.organizationId,
        language: languageMapping[langCode] || langCode,
        translatedBody: translatedText,
        filePath
      });
      
      translatedNotices.push({
        ...translatedNotice,
        languageCode: langCode,
        languageName: languageMapping[langCode] || langCode
      });
      
      // Create a notification for the translation
      try {
        await storage.createNotification({
          userId: req.user.id,
          organizationId: notice.organizationId,
          module: 'Notice',
          action: `Notice translated to ${languageMapping[langCode] || langCode}`,
          actionType: 'translated',
          message: `The notice "${notice.noticeName}" has been translated to ${languageMapping[langCode] || langCode}`,
          initiator: 'user',
          relatedItemId: notice.noticeId,
          relatedItemType: 'Notice'
        });
      } catch (error) {
        console.error('Failed to create notification:', error);
        // Continue execution even if notification creation fails
      }
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
  const format = req.query.format as string || 'pdf';
  
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
    
    // Create translated notices directory if it doesn't exist
    if (!fs.existsSync(TRANSLATED_NOTICES_DIR)) {
      fs.mkdirSync(TRANSLATED_NOTICES_DIR, { recursive: true });
    }
    
    // Handle format
    if (format === 'docx') {
      // Generate DOCX version of the notice
      const docxFilePath = path.join(TRANSLATED_NOTICES_DIR, `translated_notice_${translationId}_${Date.now()}.docx`);
      await generateDocxNotice(translatedNotice.translatedBody, docxFilePath);
      
      const fileContent = fs.readFileSync(docxFilePath);
      const baseName = translatedNotice.language.replace(/\s+/g, '_');
      const fileName = `${notice.noticeName.replace(/\s+/g, '_')}_${baseName}.docx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Send file and clean up
      res.send(fileContent);
      
      // Clean up temp file after sending
      setTimeout(() => {
        try {
          if (fs.existsSync(docxFilePath)) {
            fs.unlinkSync(docxFilePath);
          }
        } catch (cleanupError) {
          console.error("Error cleaning up temporary DOCX file:", cleanupError);
        }
      }, 5000);
      
      return;
    } else {
      // Default PDF format - use existing file or generate if needed
      if (!translatedNotice.filePath || !fs.existsSync(translatedNotice.filePath)) {
        return res.status(404).json({ message: "Translated notice file not found" });
      }
      
      const fileContent = fs.readFileSync(translatedNotice.filePath);
      const baseName = translatedNotice.language.replace(/\s+/g, '_');
      const fileName = `${notice.noticeName.replace(/\s+/g, '_')}_${baseName}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      return res.send(fileContent);
    }
  } catch (error) {
    console.error("Download translated notice error:", error);
    return res.status(500).json({ message: "An error occurred while downloading the translated notice" });
  }
};
