import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { localFolderService } from '../services/local-folder';
import { contextService } from '../services/context';
import { progressService } from '../services/progress';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Preserve original filename
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 1000 // Max 1000 files
  },
  fileFilter: (req, file, cb) => {
    // Skip node_modules and other large directories
    if (file.originalname.includes('node_modules') ||
        file.originalname.includes('.git') ||
        file.originalname.includes('dist') ||
        file.originalname.includes('build')) {
      cb(null, false);
      return;
    }
    cb(null, true);
  }
});

/**
 * POST /api/upload/folder
 * Upload and analyze a local folder
 */
router.post('/folder', upload.array('files'), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const projectName = req.body.projectName || 'uploaded-project';
    const uploadId = `upload-${Date.now()}`;
    
    console.log(`[Upload] Received ${files.length} files for project: ${projectName}`);
    
    // Update progress
    progressService.updateProgress(uploadId, 'upload', 10, `Processing ${files.length} files...`);

    // Create project directory
    const projectDir = path.join(__dirname, '../../uploads', uploadId);
    await fs.mkdir(projectDir, { recursive: true });

    // Organize files into directory structure
    progressService.updateProgress(uploadId, 'organize', 20, 'Organizing files...');

    for (const file of files) {
      const relativePath = file.originalname;
      const targetPath = path.join(projectDir, relativePath);
      const targetDir = path.dirname(targetPath);
      
      await fs.mkdir(targetDir, { recursive: true });
      await fs.rename(file.path, targetPath);
    }

    // Analyze the folder
    progressService.updateProgress(uploadId, 'analyze', 40, 'Analyzing project structure...');

    const analysis = await localFolderService.analyzeFolder(projectDir);

    // Generate context using AI
    progressService.updateProgress(uploadId, 'generate', 60, 'Generating onboarding content...');

    const context = await contextService.generateContextFromLocal({
      projectName: analysis.projectName,
      readme: analysis.readme,
      fileStructure: analysis.fileStructure,
      keyFiles: analysis.keyFiles,
      projectType: localFolderService.detectProjectType(analysis.keyFiles)
    });

    progressService.updateProgress(uploadId, 'complete', 100, 'Analysis complete!');

    // Clean up uploaded files after a delay
    setTimeout(async () => {
      try {
        await fs.rm(projectDir, { recursive: true, force: true });
        console.log(`[Upload] Cleaned up project directory: ${uploadId}`);
      } catch (error) {
        console.error(`[Upload] Error cleaning up: ${error}`);
      }
    }, 3600000); // 1 hour

    res.json({
      success: true,
      data: {
        contextId: context.contextId,
        projectName: analysis.projectName,
        totalFiles: analysis.totalFiles,
        totalSize: analysis.totalSize,
        projectType: localFolderService.detectProjectType(analysis.keyFiles)
      }
    });

  } catch (error) {
    console.error('[Upload] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    });
  }
});

/**
 * GET /api/upload/progress/:uploadId
 * Get upload progress
 */
router.get('/progress/:uploadId', (req: Request, res: Response) => {
  const { uploadId } = req.params;
  const progress = progressService.getProgress(uploadId);
  
  res.json({
    success: true,
    data: progress || { progress: 0, message: 'Starting...' }
  });
});

export default router;

// Made with Bob
