"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  FolderOpen,
  X,
  Upload,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { api } from "@/services/api";

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

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

interface FolderUploadModalProps {
  onSuccess: (contextId: string) => void;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Recursively walk a FileSystemDirectoryHandle, skipping IGNORED_DIRS. */
async function scanDirectory(dirHandle: FileSystemDirectoryHandle): Promise<{
  files: File[];
  skippedDirs: string[];
}> {
  const files: File[] = [];
  const skippedDirsSet = new Set<string>();

  async function walk(handle: FileSystemDirectoryHandle, prefix: string) {
    for await (const [name, entry] of handle) {
      if (IGNORED_DIRS.has(name)) {
        skippedDirsSet.add(name);
        continue;
      }
      const entryPath = prefix ? `${prefix}/${name}` : name;
      if (entry.kind === "directory") {
        await walk(entry as FileSystemDirectoryHandle, entryPath);
      } else {
        const rawFile = await (entry as FileSystemFileHandle).getFile();
        // Name = relative path so api.ts sends it correctly via formData
        files.push(
          new File([rawFile], entryPath, {
            type: rawFile.type,
            lastModified: rawFile.lastModified,
          }),
        );
      }
    }
  }

  await walk(dirHandle, dirHandle.name);
  return { files, skippedDirs: Array.from(skippedDirsSet) };
}

export function FolderUploadModal({
  onSuccess,
  onClose,
}: FolderUploadModalProps) {
  const fallbackInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [skippedDirs, setSkippedDirs] = useState<string[]>([]);
  const [projectName, setProjectName] = useState("");
  const [scanning, setScanning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const supportsFilePicker =
    typeof window !== "undefined" && "showDirectoryPicker" in window;

  const handlePickFolder = useCallback(async () => {
    setError("");
    if (supportsFilePicker) {
      try {
        // showDirectoryPicker does NOT trigger the "Upload X files" browser dialog
        const dirHandle = await (
          window as typeof window & {
            showDirectoryPicker: (opts?: {
              mode?: string;
            }) => Promise<FileSystemDirectoryHandle>;
          }
        ).showDirectoryPicker({ mode: "read" });

        setScanning(true);
        setFiles([]);
        setSkippedDirs([]);
        setProjectName(dirHandle.name);

        try {
          const { files: scanned, skippedDirs: skipped } =
            await scanDirectory(dirHandle);
          setFiles(scanned);
          setSkippedDirs(skipped);
        } finally {
          setScanning(false);
        }
      } catch (err) {
        setScanning(false);
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      }
    } else {
      // Fallback for browsers without File System Access API
      fallbackInputRef.current?.click();
    }
  }, [supportsFilePicker]);

  // Fallback handler (Firefox / older browsers) — webkitdirectory still shows the alert there
  const handleFallbackChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fl = e.target.files;
      if (!fl || fl.length === 0) return;
      const filtered = Array.from(fl)
        .map((f) => {
          const rel = (
            (f as File & { webkitRelativePath?: string }).webkitRelativePath ||
            f.name
          ).replace(/\\/g, "/");
          const ignored = rel.split("/").some((seg) => IGNORED_DIRS.has(seg));
          return ignored
            ? null
            : new File([f], rel, {
                type: f.type,
                lastModified: f.lastModified,
              });
        })
        .filter(Boolean) as File[];
      setFiles(filtered);
      setProjectName(filtered[0]?.name.split("/")[0] || "my-project");
      setError("");
    },
    [],
  );

  const handleUpload = useCallback(async () => {
    if (files.length === 0) {
      setError("No files selected.");
      return;
    }
    if (!projectName.trim()) {
      setError("Please enter a project name.");
      return;
    }

    const totalBytes = files.reduce((s, f) => s + f.size, 0);
    if (totalBytes > MAX_UPLOAD_BYTES) {
      setError(
        `Total size is ${formatBytes(totalBytes)}, exceeding the 50 MB limit. Remove large assets (videos, datasets) and re-select.`,
      );
      return;
    }

    setUploading(true);
    setError("");
    setProgress(0);
    setStatus("Preparing files...");

    try {
      const result = await api.uploadFolder(
        files,
        projectName.trim(),
        (pct, statusText) => {
          setProgress(pct);
          setStatus(statusText);
        },
      );

      setProgress(90);
      setStatus("Generating AI analysis...");
      await new Promise((r) => setTimeout(r, 600));
      setProgress(100);
      setStatus("Analysis ready!");
      setDone(true);
      await new Promise((r) => setTimeout(r, 1200));
      onSuccess(result.contextId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
      );
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }, [files, projectName, onSuccess]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !uploading && !scanning) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [uploading, scanning, onClose]);

  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  const oversized = totalBytes > MAX_UPLOAD_BYTES;
  const hasFiles = files.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading && !scanning) onClose();
      }}
    >
      <div className="relative w-full max-w-md mx-4 bg-bg-primary border border-border-subtle rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <FolderOpen className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Upload Local Folder</h2>
              <p className="text-xs text-muted-foreground">
                Analyze a project on your machine
              </p>
            </div>
          </div>
          {!uploading && !scanning && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-bg-secondary transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Scanning */}
          {scanning && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="p-3 bg-accent-primary/10 rounded-full">
                <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
              </div>
              <p className="text-sm font-medium">Scanning project files…</p>
              <p className="text-xs text-muted-foreground">
                Filtering build artifacts and dependencies
              </p>
            </div>
          )}

          {/* Drop zone */}
          {!scanning && !uploading && !hasFiles && (
            <div
              onClick={handlePickFolder}
              className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all border-border-subtle hover:border-accent-primary/40 hover:bg-bg-secondary"
            >
              <div className="p-3 bg-bg-secondary rounded-full">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  Choose your project folder
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="text-accent-primary underline underline-offset-2">
                    Click to browse
                  </span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-center px-2">
                <span className="font-medium text-foreground">
                  node_modules, .git, dist, build
                </span>{" "}
                and other large dirs are automatically excluded — no manual
                cleanup needed.
              </p>
            </div>
          )}

          {/* Hidden fallback input for non-Chrome browsers */}
          <input
            ref={fallbackInputRef}
            type="file"
            // @ts-expect-error – non-standard
            webkitdirectory=""
            multiple
            className="hidden"
            onChange={handleFallbackChange}
          />

          {/* File stats */}
          {!scanning && !uploading && hasFiles && (
            <div className="space-y-3">
              <div className="p-4 bg-bg-secondary rounded-xl border border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-accent-primary" />
                    <span className="font-medium text-sm">{projectName}</span>
                  </div>
                  <button
                    onClick={() => {
                      setFiles([]);
                      setSkippedDirs([]);
                      setProjectName("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Change
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex flex-col gap-0.5 p-2.5 bg-bg-elevated rounded-lg">
                    <span className="text-muted-foreground">To upload</span>
                    <span className="font-semibold text-foreground">
                      {files.length} files · {formatBytes(totalBytes)}
                    </span>
                  </div>
                  {skippedDirs.length > 0 && (
                    <div className="flex flex-col gap-0.5 p-2.5 bg-bg-elevated rounded-lg">
                      <span className="text-muted-foreground">Excluded</span>
                      <span className="font-semibold text-emerald-400">
                        {skippedDirs.slice(0, 3).join(", ")}
                        {skippedDirs.length > 3
                          ? ` +${skippedDirs.length - 3}`
                          : ""}
                      </span>
                    </div>
                  )}
                </div>

                {oversized && (
                  <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400">
                      {formatBytes(totalBytes)} exceeds the 50 MB limit. Remove
                      large assets (videos, datasets) and re-select.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="my-project"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-subtle rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary/50 transition-all"
                />
              </div>
            </div>
          )}

          {/* Upload progress / done */}
          {uploading && (
            <div className="space-y-3">
              {done ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="p-3 bg-emerald-500/10 rounded-full">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="font-semibold text-sm">Analysis ready!</p>
                  <p className="text-xs text-muted-foreground">
                    Opening your project insights…
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-accent-primary" />
                    <span className="text-foreground/80">{status}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {progress < 50
                      ? "Uploading source files..."
                      : progress < 90
                        ? "Processing project structure..."
                        : "Running AI analysis..."}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!uploading && !scanning && (
          <div className="flex gap-3 p-5 pt-0">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border-subtle text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-bg-secondary transition-all"
            >
              Cancel
            </button>
            {!hasFiles ? (
              <button
                onClick={handlePickFolder}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-bg-secondary border border-border-subtle text-sm font-medium hover:bg-bg-elevated transition-all"
              >
                <FolderOpen className="w-4 h-4" />
                Choose Folder
              </button>
            ) : (
              <button
                onClick={handleUpload}
                disabled={
                  !projectName.trim() || oversized || files.length === 0
                }
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <Upload className="w-4 h-4" />
                Analyze {files.length} files
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Made with Bob
