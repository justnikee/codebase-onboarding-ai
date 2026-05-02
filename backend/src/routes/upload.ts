import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { localFolderService } from "../services/local-folder";
import { contextService } from "../services/context";
import { progressService } from "../services/progress";

const router = express.Router();

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  "__pycache__",
  ".venv",
  "venv",
  "target",
  "bin",
  "obj",
  ".idea",
  ".vscode",
  "out",
  ".turbo",
  ".cache",
]);

// Use memory storage — avoids all disk rename issues
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 1000,
  },
  fileFilter: (req, file, cb) => {
    // Safety net: reject files whose path contains ignored dirs
    const rel = file.originalname.replace(/\\/g, "/");
    const ignored = rel.split("/").some((seg) => IGNORED_DIRS.has(seg));
    cb(null, !ignored);
  },
});

/**
 * POST /api/upload/folder
 * Upload and analyze a local folder
 */
router.post(
  "/folder",
  upload.array("files"),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res
          .status(400)
          .json({ success: false, error: "No files uploaded" });
      }

      const projectName =
        (req.body.projectName as string | undefined)?.trim() ||
        "uploaded-project";
      const uploadId = `upload-${Date.now()}`;
      const projectDir = path.join(process.cwd(), "uploads", uploadId);

      console.log(
        `[Upload] Received ${files.length} files for project: ${projectName}`,
      );
      progressService.updateProgress(
        uploadId,
        "upload",
        10,
        `Processing ${files.length} files...`,
      );

      // Write files to disk, stripping the root folder name so analyzeFolder sees clean structure
      // e.g. "TrendArena/src/index.ts" → writes to projectDir/src/index.ts
      for (const file of files) {
        const rel = file.originalname.replace(/\\/g, "/");
        const parts = rel.split("/");
        // Strip first segment if it looks like a root folder (more than one segment)
        const stripped = parts.length > 1 ? parts.slice(1).join("/") : rel;
        if (!stripped) continue; // skip root dir entries

        const targetPath = path.join(projectDir, stripped);
        const targetDir = path.dirname(targetPath);
        await fs.mkdir(targetDir, { recursive: true });
        await fs.writeFile(targetPath, file.buffer);
      }

      progressService.updateProgress(
        uploadId,
        "analyze",
        40,
        "Analyzing project structure...",
      );
      const analysis = await localFolderService.analyzeFolder(projectDir);

      progressService.updateProgress(
        uploadId,
        "generate",
        60,
        "Generating onboarding content...",
      );
      const context = await contextService.generateContextFromLocal({
        projectName, // use the name the user typed
        readme: analysis.readme,
        fileStructure: analysis.fileStructure,
        keyFiles: analysis.keyFiles,
        projectType: localFolderService.detectProjectType(analysis.keyFiles),
      });

      progressService.updateProgress(
        uploadId,
        "complete",
        100,
        "Analysis complete!",
      );

      // Clean up temp files after 1 hour
      setTimeout(async () => {
        try {
          await fs.rm(projectDir, { recursive: true, force: true });
        } catch {
          /* ignore */
        }
      }, 3_600_000);

      res.json({
        success: true,
        data: {
          contextId: context.contextId,
          projectName,
          totalFiles: analysis.totalFiles,
          totalSize: analysis.totalSize,
          projectType: localFolderService.detectProjectType(analysis.keyFiles),
        },
      });
    } catch (error) {
      console.error("[Upload] Error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  },
);

/**
 * GET /api/upload/progress/:uploadId
 * Get upload progress
 */
router.get("/progress/:uploadId", (req: Request, res: Response) => {
  const { uploadId } = req.params;
  const progress = progressService.getProgress(uploadId);

  res.json({
    success: true,
    data: progress || { progress: 0, message: "Starting..." },
  });
});

export default router;

// Made with Bob
