import { Request, Response } from 'express';
import { db } from '../db';
import { notices, translatedNotices } from '@shared/schema';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { AuthRequest } from '../types';
import { fileURLToPath } from 'url';
import { modelDownloadManager } from '../services/modelDownloadManager';

// Handle ES modules vs CommonJS for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants for translation service configuration
const TRANSLATION_MODELS_PATH = process.env.TRANSLATION_MODELS_PATH || path.join(__dirname, '../../models/translation');
const SUPPORTED_INDIC_LANGUAGES = [
  { code: 'asm', name: 'Assamese', script: 'Beng' },
  { code: 'ben', name: 'Bengali', script: 'Beng' },
  { code: 'brx', name: 'Bodo', script: 'Deva' },
  { code: 'doi', name: 'Dogri', script: 'Deva' },
  { code: 'gom', name: 'Konkani', script: 'Deva' },
  { code: 'guj', name: 'Gujarati', script: 'Gujr' },
  { code: 'hin', name: 'Hindi', script: 'Deva' },
  { code: 'kan', name: 'Kannada', script: 'Knda' },
  { code: 'kas', name: 'Kashmiri', script: 'Arab' }, // Also available in Deva script
  { code: 'mai', name: 'Maithili', script: 'Deva' },
  { code: 'mal', name: 'Malayalam', script: 'Mlym' },
  { code: 'mar', name: 'Marathi', script: 'Deva' },
  { code: 'mni', name: 'Manipuri', script: 'Beng' }, // Also available in Mtei script
  { code: 'npi', name: 'Nepali', script: 'Deva' },
  { code: 'ory', name: 'Odia', script: 'Orya' },
  { code: 'pan', name: 'Punjabi', script: 'Guru' },
  { code: 'san', name: 'Sanskrit', script: 'Deva' },
  { code: 'sat', name: 'Santali', script: 'Olck' },
  { code: 'snd', name: 'Sindhi', script: 'Arab' }, // Also available in Deva script
  { code: 'tam', name: 'Tamil', script: 'Taml' },
  { code: 'tel', name: 'Telugu', script: 'Telu' },
  { code: 'urd', name: 'Urdu', script: 'Arab' }
];

// Language code with script format mapping
const LANGUAGE_CODE_MAP = SUPPORTED_INDIC_LANGUAGES.reduce((map, lang) => {
  map[lang.code] = `${lang.code}_${lang.script}`;
  return map;
}, {} as Record<string, string>);

/**
 * Get supported translation languages
 */
export const getSupportedLanguages = (req: Request, res: Response) => {
  try {
    res.status(200).json({
      languages: SUPPORTED_INDIC_LANGUAGES.map(lang => ({
        code: lang.code,
        name: lang.name,
        fullCode: `${lang.code}_${lang.script}`
      })),
      services: [
        { id: 'google', name: 'Google Translate' },
        { id: 'indictrans2', name: 'LLM Model (API)' }
      ]
    });
  } catch (error) {
    console.error('Error fetching supported languages:', error);
    res.status(500).json({ message: 'Failed to fetch supported languages' });
  }
};

/**
 * Check if IndicTrans2 models are available locally
 */
export const checkModelAvailability = (req: Request, res: Response) => {
  try {
    const modelStatus = modelDownloadManager.getModelStatus();
    const downloadProgress = modelDownloadManager.getAllDownloadProgress();
    const verificationResults = modelDownloadManager.verifyModels();
    
    const modelsReady = Object.values(verificationResults).every(ready => ready);
    const anyModelDownloaded = Object.values(verificationResults).some(ready => ready);
    
    res.status(200).json({
      modelsAvailable: anyModelDownloaded,
      modelsReady: modelsReady,
      modelsPath: modelStatus.modelsDir,
      totalStorageRequired: modelStatus.totalSize,
      models: modelStatus.models,
      downloadProgress: downloadProgress,
      verification: verificationResults
    });
  } catch (error) {
    console.error('Error checking model availability:', error);
    res.status(500).json({ message: 'Failed to check model availability' });
  }
};

/**
 * Download IndicTrans2 models with progress tracking
 */
export const downloadModels = async (req: Request, res: Response) => {
  try {
    const { modelId, downloadAll } = req.body;
    
    if (downloadAll) {
      // Start downloading all models
      res.status(202).json({
        message: 'All models download initiated',
        status: 'downloading',
        estimatedTimeMinutes: 45,
        totalModels: 3
      });
      
      // Start the download process in the background
      modelDownloadManager.downloadAllModels().catch(error => {
        console.error('Error downloading all models:', error);
      });
    } else if (modelId) {
      // Download specific model
      const modelStatus = modelDownloadManager.getModelStatus();
      const model = modelStatus.models.find(m => m.id === modelId);
      
      if (!model) {
        return res.status(400).json({ message: 'Invalid model ID' });
      }
      
      if (model.downloaded) {
        return res.status(200).json({ 
          message: 'Model already downloaded',
          modelId,
          status: 'completed'
        });
      }
      
      res.status(202).json({
        message: `Model ${modelId} download initiated`,
        status: 'downloading',
        modelId,
        estimatedTimeMinutes: 15
      });
      
      // Start the download process in the background
      modelDownloadManager.downloadModel(modelId).catch(error => {
        console.error(`Error downloading model ${modelId}:`, error);
      });
    } else {
      return res.status(400).json({ 
        message: 'Please specify modelId or set downloadAll to true' 
      });
    }
  } catch (error) {
    console.error('Error initiating model download:', error);
    res.status(500).json({ message: 'Failed to initiate model download' });
  }
};

/**
 * Translate a notice to a specific language
 * For demo purposes, we'll implement both Google Translate and local model paths
 */
export const translateNotice = async (req: AuthRequest, res: Response) => {
  try {
    const { noticeId, targetLanguage, translationService } = req.body;
    
    if (!noticeId || !targetLanguage || !translationService) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Check if notice exists
    const [notice] = await db
      .select()
      .from(notices)
      .where(eq(notices.noticeId, noticeId))
      .execute();
      
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    
    // Check if notice already has a translation in this language
    const existingTranslations = await db
      .select()
      .from(translatedNotices)
      .execute();
      
    const existingTranslation = existingTranslations.find(
      t => t.noticeId === noticeId && t.language === targetLanguage
    );
      
    if (existingTranslation) {
      return res.status(200).json({ 
        message: 'Translation already exists',
        translation: existingTranslation
      });
    }
    
    // Perform translation based on selected service
    let translatedText = '';
    
    if (translationService === 'google') {
      // Simulate Google Translate API call
      // In a real implementation, you would call the Google Translate API
      translatedText = `[Google Translated] ${notice.noticeBody}`;
      
    } else if (translationService === 'indictrans2') {
      // Use local IndicTrans2 model for translation
      // This would call a Python script or directly use the model
      translatedText = await translateWithIndicTrans2(notice.noticeBody, targetLanguage);
    } else {
      return res.status(400).json({ message: 'Invalid translation service' });
    }
    
    // Save the translated notice
    const [translatedNotice] = await db
      .insert(translatedNotices)
      .values({
        noticeId: notice.noticeId,
        organizationId: notice.organizationId,
        language: targetLanguage,
        translatedBody: translatedText,
        createdOn: new Date()
      })
      .returning();
      
    res.status(201).json({
      message: 'Notice translated successfully',
      translation: translatedNotice
    });
    
  } catch (error) {
    console.error('Error translating notice:', error);
    res.status(500).json({ message: 'Failed to translate notice' });
  }
};

/**
 * Get all translations for a specific notice
 */
export const getNoticeTranslations = async (req: Request, res: Response) => {
  try {
    const { noticeId } = req.params;
    
    if (!noticeId || noticeId === 'undefined') {
      return res.status(200).json([]);
    }
    
    const translations = await db
      .select()
      .from(translatedNotices)
      .execute();
      
    // Filter the translations for this notice
    const noticeTranslations = translations.filter(t => t.noticeId === parseInt(noticeId));
      
    res.status(200).json(noticeTranslations);
  } catch (error) {
    console.error('Error fetching notice translations:', error);
    res.status(500).json({ message: 'Failed to fetch notice translations' });
  }
};

/**
 * Utility function to translate text using the IndicTrans2 model
 * This calls our Python script which will simulate or eventually use the real model
 */
async function translateWithIndicTrans2(text: string, targetLanguage: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if the target language is supported
    if (!LANGUAGE_CODE_MAP[targetLanguage]) {
      reject(new Error(`Unsupported language: ${targetLanguage}`));
      return;
    }
    
    // Get the full language code with script
    const fullLanguageCode = LANGUAGE_CODE_MAP[targetLanguage];
    
    // Call the Python script to translate the text
    const pythonProcess = spawn('python3', [
      path.join(__dirname, '../../scripts/translate.py'),
      '--text', text,
      '--target_lang', fullLanguageCode
    ]);
    
    let translatedText = '';
    let errorOutput = '';
    
    // Collect output from the Python script
    pythonProcess.stdout.on('data', (data) => {
      translatedText += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Translation script exited with code ${code}`);
        console.error(`Error output: ${errorOutput}`);
        reject(new Error(`Translation failed with code ${code}: ${errorOutput}`));
        return;
      }
      
      resolve(translatedText.trim());
    });
    
    // Handle process errors
    pythonProcess.on('error', (err) => {
      console.error('Failed to start translation process:', err);
      reject(err);
    });
  });
}

/**
 * Setup translation service on server startup
 * This should be called when the server starts
 */
export function setupTranslationService() {
  console.log('Setting up translation service...');
  
  // Check if models directory exists, create if needed
  if (!fs.existsSync(TRANSLATION_MODELS_PATH)) {
    fs.mkdirSync(TRANSLATION_MODELS_PATH, { recursive: true });
    console.log(`Created translation models directory: ${TRANSLATION_MODELS_PATH}`);
  }
  
  // In a real implementation, you would check for model files and download if needed
  console.log('Translation service setup complete');
}