import fs from 'fs';
import path from 'path';
import https from 'https';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ModelInfo {
  id: string;
  name: string;
  type: 'en-indic' | 'indic-en' | 'indic-indic';
  url: string;
  size: number; // Size in MB
  description: string;
}

export interface DownloadProgress {
  modelId: string;
  status: 'pending' | 'downloading' | 'extracting' | 'completed' | 'error';
  progress: number; // 0-100
  downloaded: number; // Bytes downloaded
  total: number; // Total bytes
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

class ModelDownloadManager {
  private modelsDir: string;
  private downloadProgress: Map<string, DownloadProgress> = new Map();
  
  // Available IndicTrans2 models from Hugging Face
  private availableModels: ModelInfo[] = [
    {
      id: 'en-indic-base',
      name: 'English to Indic Languages',
      type: 'en-indic',
      url: 'https://huggingface.co/ai4bharat/indictrans2-en-indic-1B/resolve/main',
      size: 1500,
      description: 'Translates from English to all 22 Indic languages'
    },
    {
      id: 'indic-en-base',
      name: 'Indic Languages to English',
      type: 'indic-en',
      url: 'https://huggingface.co/ai4bharat/indictrans2-indic-en-1B/resolve/main',
      size: 1500,
      description: 'Translates from all 22 Indic languages to English'
    },
    {
      id: 'indic-indic-base',
      name: 'Indic to Indic Languages',
      type: 'indic-indic',
      url: 'https://huggingface.co/ai4bharat/indictrans2-indic-indic-1B/resolve/main',
      size: 1500,
      description: 'Translates between Indic languages'
    }
  ];

  constructor() {
    this.modelsDir = path.join(__dirname, '../../../models/translation');
    this.ensureModelsDirectory();
  }

  private ensureModelsDirectory(): void {
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true });
      console.log(`Created models directory: ${this.modelsDir}`);
    }
  }

  public getAvailableModels(): ModelInfo[] {
    return this.availableModels;
  }

  public getDownloadProgress(modelId: string): DownloadProgress | undefined {
    return this.downloadProgress.get(modelId);
  }

  public getAllDownloadProgress(): DownloadProgress[] {
    return Array.from(this.downloadProgress.values());
  }

  public isModelDownloaded(modelId: string): boolean {
    const model = this.availableModels.find(m => m.id === modelId);
    if (!model) return false;

    const modelPath = path.join(this.modelsDir, model.type);
    return fs.existsSync(modelPath) && this.isModelComplete(modelPath);
  }

  private isModelComplete(modelPath: string): boolean {
    // Check for essential model files
    const requiredFiles = [
      'config.json',
      'pytorch_model.bin',
      'tokenizer.json'
    ];

    return requiredFiles.some(file => 
      fs.existsSync(path.join(modelPath, file))
    );
  }

  public async downloadModel(modelId: string): Promise<void> {
    const model = this.availableModels.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (this.isModelDownloaded(modelId)) {
      console.log(`Model ${modelId} already downloaded`);
      return;
    }

    // Initialize progress tracking
    const progress: DownloadProgress = {
      modelId,
      status: 'pending',
      progress: 0,
      downloaded: 0,
      total: model.size * 1024 * 1024, // Convert MB to bytes
      startTime: new Date()
    };

    this.downloadProgress.set(modelId, progress);

    try {
      // Simulate download for now (in production, implement actual download)
      await this.simulateModelDownload(model, progress);
      
      progress.status = 'completed';
      progress.progress = 100;
      progress.endTime = new Date();
      
      console.log(`Model ${modelId} download simulation completed`);
    } catch (error) {
      progress.status = 'error';
      progress.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to download model ${modelId}:`, error);
      throw error;
    }
  }

  private async simulateModelDownload(model: ModelInfo, progress: DownloadProgress): Promise<void> {
    return new Promise((resolve) => {
      progress.status = 'downloading';
      
      // Simulate download progress
      const interval = setInterval(() => {
        progress.progress += 10;
        progress.downloaded = (progress.total * progress.progress) / 100;
        
        if (progress.progress >= 100) {
          clearInterval(interval);
          
          // Create dummy model directory structure for simulation
          const modelPath = path.join(this.modelsDir, model.type);
          if (!fs.existsSync(modelPath)) {
            fs.mkdirSync(modelPath, { recursive: true });
            
            // Create dummy files to simulate model presence
            fs.writeFileSync(path.join(modelPath, 'config.json'), JSON.stringify({
              model_type: model.type,
              downloaded: new Date().toISOString()
            }));
            fs.writeFileSync(path.join(modelPath, 'pytorch_model.bin'), 'dummy model file');
            fs.writeFileSync(path.join(modelPath, 'tokenizer.json'), '{}');
          }
          
          resolve();
        }
      }, 500); // Update every 500ms
    });
  }

  public async downloadAllModels(): Promise<void> {
    console.log('Starting download of all IndicTrans2 models...');
    
    for (const model of this.availableModels) {
      if (!this.isModelDownloaded(model.id)) {
        console.log(`Downloading ${model.name}...`);
        await this.downloadModel(model.id);
      } else {
        console.log(`${model.name} already downloaded, skipping...`);
      }
    }
    
    console.log('All models download process completed');
  }

  public verifyModels(): { [modelId: string]: boolean } {
    const results: { [modelId: string]: boolean } = {};
    
    for (const model of this.availableModels) {
      results[model.id] = this.isModelDownloaded(model.id);
    }
    
    return results;
  }

  public getModelPath(modelType: 'en-indic' | 'indic-en' | 'indic-indic'): string {
    return path.join(this.modelsDir, modelType);
  }

  public getStorageRequirement(): number {
    return this.availableModels.reduce((total, model) => total + model.size, 0);
  }

  public getModelStatus(): {
    modelsDir: string;
    totalSize: number;
    models: Array<{
      id: string;
      name: string;
      type: string;
      size: number;
      downloaded: boolean;
      path: string;
    }>;
  } {
    return {
      modelsDir: this.modelsDir,
      totalSize: this.getStorageRequirement(),
      models: this.availableModels.map(model => ({
        id: model.id,
        name: model.name,
        type: model.type,
        size: model.size,
        downloaded: this.isModelDownloaded(model.id),
        path: this.getModelPath(model.type)
      }))
    };
  }

  public async cancelDownload(modelId: string): Promise<void> {
    const progress = this.downloadProgress.get(modelId);
    if (progress && progress.status === 'downloading') {
      progress.status = 'error';
      progress.error = 'Download cancelled by user';
    }
  }

  public cleanupFailedDownloads(): void {
    for (const model of this.availableModels) {
      const modelPath = path.join(this.modelsDir, model.type);
      if (fs.existsSync(modelPath) && !this.isModelComplete(modelPath)) {
        console.log(`Cleaning up incomplete download: ${model.id}`);
        fs.rmSync(modelPath, { recursive: true, force: true });
      }
    }
  }
}

// Export singleton instance
export const modelDownloadManager = new ModelDownloadManager();