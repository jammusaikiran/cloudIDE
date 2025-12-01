import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useFileStore } from "../store/useFileStore";
import {
    Folder,
    File as FileIcon,
    ChevronRight,
    ChevronDown,
    Save,
    X,
    ArrowLeft,
    Loader2,
    Trash2,
    FolderPlus,
    FilePlus,
    Play,
    Terminal,
    Code2,
    Zap,
    AlertTriangle,
    Copy,
    Check,
    Upload,
    FolderUp,
    MessageSquare,
    Sparkles,
    Users,
    Keyboard,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import toast from "react-hot-toast";
import { axiosInstance } from "../utils/axiosInstance";
import { registerCompletionProvider } from "../utils/intellisense";
import CopilotChat from "../components/CopilotChat";

// Keyboard Shortcut Row Component
const ShortcutRow = ({ keys, description, icon }) => (
    <div className="flex items-center justify-between py-3 px-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
        <div className="flex items-center gap-3">
            {icon}
            <span className="text-gray-300 text-sm">{description}</span>
        </div>
        <div className="flex items-center gap-1">
            {keys.map((key, index) => (
                <span key={index} className="flex items-center gap-1">
                    <kbd className="px-2.5 py-1 bg-gray-900 border border-gray-700 rounded text-xs font-mono text-gray-300 shadow-sm">
                        {key}
                    </kbd>
                    {index < keys.length - 1 && <span className="text-gray-600 text-xs">+</span>}
                </span>
            ))}
        </div>
    </div>
);

// Confirmation Dialog Component
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, type = "danger" }) => {
    if (!isOpen) return null;

    const typeStyles = {
        danger: {
            icon: <AlertTriangle className="text-red-400" size={24} />,
            iconBg: "bg-red-500/10",
            confirmBtn: "bg-red-600 hover:bg-red-700",
        },
        warning: {
            icon: <AlertTriangle className="text-orange-400" size={24} />,
            iconBg: "bg-orange-500/10",
            confirmBtn: "bg-orange-600 hover:bg-orange-700",
        },
    };

    const style = typeStyles[type] || typeStyles.danger;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
                <div className="flex items-start gap-4 mb-6">
                    <div className={`p-3 ${style.iconBg} rounded-lg`}>
                        {style.icon}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
                    </div>
                </div>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-all text-white font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-5 py-2.5 rounded-lg ${style.confirmBtn} transition-all text-white font-medium`}
                    >
                        Confirm
                    </button>
                </div>
            </div>

            <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
        </div>
    );
};

// Recursive File Tree Component with Hover Actions
const FileTreeNode = ({ node, onFileSelect, selectedFileId, onRefresh, level = 0 }) => {
    const [expanded, setExpanded] = useState(false);
    const [showFolderMenu, setShowFolderMenu] = useState(false);
    const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
    const [showCreateFileDialog, setShowCreateFileDialog] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [newFileName, setNewFileName] = useState("");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);
    const { createFolder, deleteFolder } = useFileStore();

    const hasSubfolders = node.subfolders && node.subfolders.length > 0;
    const hasFiles = node.files && node.files.length > 0;
    const hasChildren = hasSubfolders || hasFiles;

    const paddingLeft = `${level * 16 + 8}px`;

    // Handle file upload
    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            
            files.forEach(file => {
                formData.append("files", file);
            });
            formData.append("folderId", node._id);

            const response = await axiosInstance.post("/files/upload-file", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                toast.success(`${files.length} file(s) uploaded successfully!`);
                onRefresh();
            } else {
                toast.error(response.data.message || "Failed to upload files");
            }
        } catch (error) {
            console.error("Error uploading files:", error);
            toast.error(error.response?.data?.message || "Error uploading files");
        } finally {
            setUploading(false);
            event.target.value = ''; // Reset input
        }
    };

    // Handle folder upload (directory with webkitdirectory)
    const handleFolderUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const token = localStorage.getItem("token");
            
            // Group files by their directory structure
            const filesByFolder = {};
            files.forEach(file => {
                const pathParts = file.webkitRelativePath.split('/');
                const folderPath = pathParts.slice(0, -1).join('/');
                if (!filesByFolder[folderPath]) {
                    filesByFolder[folderPath] = [];
                }
                filesByFolder[folderPath].push(file);
            });

            // Create folders first, then upload files
            const folderMap = {}; // Map relative path to folder ID
            folderMap[''] = node._id; // Root is current node

            // Sort folder paths to create parent folders first
            const folderPaths = Object.keys(filesByFolder).sort();
            
            for (const folderPath of folderPaths) {
                if (folderPath === '') continue; // Skip root
                
                const pathParts = folderPath.split('/');
                let currentPath = '';
                
                for (const part of pathParts) {
                    const parentPath = currentPath;
                    currentPath = currentPath ? `${currentPath}/${part}` : part;
                    
                    if (!folderMap[currentPath]) {
                        // Create this folder
                        const parentId = folderMap[parentPath];
                        const folderResponse = await axiosInstance.post(
                            '/folder/create',
                            { name: part, parentId },
                            { headers: { Authorization: `Bearer ${token}` }}
                        );
                        folderMap[currentPath] = folderResponse.data.data._id;
                    }
                }
            }

            // Now upload all files to their respective folders
            for (const [folderPath, filesInFolder] of Object.entries(filesByFolder)) {
                const folderId = folderMap[folderPath];
                const formData = new FormData();
                
                filesInFolder.forEach(file => {
                    formData.append("files", file);
                });
                formData.append("folderId", folderId);

                await axiosInstance.post("/files/upload-file", formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                });
            }

            toast.success(`Folder uploaded successfully with ${files.length} file(s)!`);
            onRefresh();
        } catch (error) {
            console.error("Error uploading folder:", error);
            toast.error(error.response?.data?.message || "Error uploading folder");
        } finally {
            setUploading(false);
            event.target.value = ''; // Reset input
        }
    };

    // Handle create folder
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            toast.error("Folder name cannot be empty!");
            return;
        }
        try {
            await createFolder(newFolderName.trim(), node._id);
            setNewFolderName("");
            setShowCreateFolderDialog(false);
            toast.success("Folder created successfully!");
            onRefresh();
        } catch (error) {
            toast.error("Error creating folder");
        }
    };

    // Handle create file
    const handleCreateFile = async () => {
        if (!newFileName.trim()) {
            toast.error("File name cannot be empty!");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const fileName = newFileName.trim();

            const getContentType = (filename) => {
                const ext = filename.split('.').pop().toLowerCase();
                const typeMap = {
                    'js': 'text/javascript',
                    'jsx': 'text/javascript',
                    'ts': 'text/typescript',
                    'tsx': 'text/typescript',
                    'json': 'application/json',
                    'html': 'text/html',
                    'css': 'text/css',
                    'txt': 'text/plain',
                    'md': 'text/markdown',
                    'py': 'text/x-python',
                    'java': 'text/x-java',
                    'cpp': 'text/x-c++src',
                    'c': 'text/x-csrc',
                };
                return typeMap[ext] || 'text/plain';
            };

            const emptyContent = "";
            const contentType = getContentType(fileName);
            const blob = new Blob([emptyContent], { type: contentType });
            const fileObj = new window.File([blob], fileName, { type: contentType });

            const formData = new FormData();
            formData.append("files", fileObj);
            formData.append("folderId", node._id);

            const response = await axiosInstance.post("/files/upload-file", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                setNewFileName("");
                setShowCreateFileDialog(false);
                toast.success("File created successfully!");
                onRefresh();
            } else {
                toast.error(response.data.message || "Failed to create file");
            }
        } catch (error) {
            console.error("Error creating file:", error);
            toast.error(error.response?.data?.message || "Error creating file");
        }
    };

    // Handle delete folder
    const handleDeleteFolder = async () => {
        try {
            await deleteFolder(node._id);
            toast.success("Folder deleted successfully!");
            onRefresh();
        } catch (error) {
            toast.error("Error deleting folder");
        }
    };

    return (
        <div>
            {/* Folder Row */}
            <div
                className="group flex items-center gap-2 py-2 px-2 hover:bg-gray-800/50 rounded-lg transition-colors relative"
                style={{ paddingLeft }}
                onMouseEnter={() => setShowFolderMenu(true)}
                onMouseLeave={() => setShowFolderMenu(false)}
            >
                <div
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                    onClick={() => hasChildren && setExpanded(!expanded)}
                >
                    {hasChildren ? (
                        expanded ? (
                            <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                        ) : (
                            <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                        )
                    ) : (
                        <span className="w-4 flex-shrink-0" />
                    )}
                    <Folder size={16} className="text-yellow-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-300 truncate">{node.name}</span>
                </div>

                {/* Folder Actions Menu */}
                {showFolderMenu && (
                    <div className="flex items-center gap-1 opacity-100 bg-gray-800/80 px-1.5 py-1 rounded-md shadow-lg">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                            className="p-1.5 hover:bg-gray-700 rounded transition"
                            title="Upload Files"
                            disabled={uploading}
                        >
                            <Upload size={16} className={uploading ? "text-gray-500" : "text-purple-400"} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                folderInputRef.current?.click();
                            }}
                            className="p-1.5 hover:bg-gray-700 rounded transition"
                            title="Upload Folder"
                            disabled={uploading}
                        >
                            <FolderUp size={16} className={uploading ? "text-gray-500" : "text-orange-400"} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCreateFileDialog(true);
                            }}
                            className="p-1.5 hover:bg-gray-700 rounded transition"
                            title="Create New File"
                        >
                            <FilePlus size={16} className="text-blue-400" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCreateFolderDialog(true);
                            }}
                            className="p-1.5 hover:bg-gray-700 rounded transition"
                            title="Create Folder"
                        >
                            <FolderPlus size={16} className="text-green-400" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(true);
                            }}
                            className="p-1.5 hover:bg-gray-700 rounded transition"
                            title="Delete Folder"
                        >
                            <Trash2 size={16} className="text-red-400" />
                        </button>
                    </div>
                )}
            </div>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteFolder}
                title="Delete Folder?"
                message={`Are you sure you want to delete "${node.name}" and all its contents? This action cannot be undone.`}
                type="danger"
            />

            {/* Create Folder Dialog */}
            {showCreateFolderDialog && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-96 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-white">Create New Folder</h3>
                        <input
                            type="text"
                            placeholder="Folder name"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateFolderDialog(false);
                                    setNewFolderName("");
                                }}
                                className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 transition-transform"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create File Dialog */}
            {showCreateFileDialog && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-96 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-white">Create New File</h3>
                        <input
                            type="text"
                            placeholder="File name (e.g., index.js)"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleCreateFile()}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateFileDialog(false);
                                    setNewFileName("");
                                }}
                                className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFile}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 transition-transform"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Files in this folder */}
            {expanded && hasFiles && (
                <div>
                    {node.files.map((file) => (
                        <FileItem
                            key={file._id}
                            file={file}
                            onFileSelect={onFileSelect}
                            selectedFileId={selectedFileId}
                            onRefresh={onRefresh}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}

            {/* Subfolders */}
            {expanded && hasSubfolders && (
                <div>
                    {node.subfolders.map((subfolder) => (
                        <FileTreeNode
                            key={subfolder._id}
                            node={subfolder}
                            onFileSelect={onFileSelect}
                            selectedFileId={selectedFileId}
                            onRefresh={onRefresh}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}

            {/* Hidden file inputs for upload */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                accept="*/*"
            />
            <input
                ref={folderInputRef}
                type="file"
                multiple
                webkitdirectory=""
                directory=""
                onChange={handleFolderUpload}
                style={{ display: 'none' }}
            />
        </div>
    );
};

// File Item Component with Delete Option
const FileItem = ({ file, onFileSelect, selectedFileId, onRefresh, level }) => {
    const [showFileMenu, setShowFileMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { deleteFile } = useFileStore();

    const paddingLeft = `${level * 16 + 8}px`;

    const handleDeleteFile = async () => {
        try {
            await deleteFile(file._id);
            toast.success("File deleted successfully!");
            onRefresh();
        } catch (error) {
            toast.error("Error deleting file");
        }
    };

    return (
        <>
            <div
                className={`group flex items-center gap-2 py-2 px-2 cursor-pointer rounded-lg transition-colors relative ${selectedFileId === file._id
                        ? "bg-blue-500/20 text-blue-400 border-l-2 border-blue-500"
                        : "hover:bg-gray-800/50 text-gray-300"
                    }`}
                style={{ paddingLeft }}
                onClick={() => onFileSelect(file)}
                onMouseEnter={() => setShowFileMenu(true)}
                onMouseLeave={() => setShowFileMenu(false)}
            >
                <span className="w-4 flex-shrink-0" />
                <FileIcon size={14} className="flex-shrink-0" />
                <span className="text-sm truncate flex-1">{file.name}</span>

                {/* File Actions Menu */}
                {showFileMenu && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(true);
                        }}
                        className="p-1 hover:bg-gray-700 rounded transition"
                        title="Delete File"
                    >
                        <Trash2 size={14} className="text-red-400" />
                    </button>
                )}
            </div>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteFile}
                title="Delete File?"
                message={`Are you sure you want to delete "${file.name}"? This action cannot be undone.`}
                type="danger"
            />
        </>
    );
};

// Main Folder Editor Page
const FolderEditor = () => {
    const { folderId, fileId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { fetchFolderStructure } = useFileStore();

    const [folderData, setFolderData] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState("");
    const [originalContent, setOriginalContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [copied, setCopied] = useState(false);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    const autoSaveTimeoutRef = useRef(null);
    const [copilotVisible, setCopilotVisible] = useState(true);

    // Collaboration states
    const [isCollaborative, setIsCollaborative] = useState(false);
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [notifyMessage, setNotifyMessage] = useState("");
    const [notifying, setNotifying] = useState(false);

    // Code execution states
    const [codeOutput, setCodeOutput] = useState("");
    const [showOutput, setShowOutput] = useState(false);
    const [isRunning, setIsRunning] = useState(false);

    // Confirmation dialogs
    const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [pendingFileSelect, setPendingFileSelect] = useState(null);
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

    // Central Action Dispatcher
    const actions = {
        SAVE_FILE: async () => {
            if (!selectedFile || !hasUnsavedChanges) {
                if (selectedFile && !hasUnsavedChanges) {
                    toast.success("No changes to save");
                } else {
                    toast.error("No file selected");
                }
                return;
            }

            setSaving(true);
            try {
                const token = localStorage.getItem("token");
                const response = await axiosInstance.put(
                    `/files/content/${selectedFile._id}`,
                    { content: fileContent },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (response.data.success) {
                    toast.success("File saved successfully!");
                    setOriginalContent(fileContent);
                    setHasUnsavedChanges(false);
                } else {
                    toast.error("Failed to save file");
                }
            } catch (error) {
                console.error("Error saving file:", error);
                toast.error("Error saving file");
            } finally {
                setSaving(false);
            }
        },
        RUN_CODE: async () => {
            if (!selectedFile || !fileContent) {
                toast.error("No code to run");
                return;
            }

            const ext = selectedFile.name.split(".").pop().toLowerCase();
            const supportedLangs = [
                "js", "jsx", "ts", "tsx", "py", "java", "c", "cpp",
                "go", "rs", "rb", "php", "cs", "swift", "kt", "pl",
                "r", "scala", "lua", "sh", "bash"
            ];

            if (!supportedLangs.includes(ext)) {
                toast.error(`Unsupported file type: .${ext}`);
                return;
            }

            setIsRunning(true);
            setShowOutput(true);
            setCodeOutput("⚡ Running code...");

            try {
                const token = localStorage.getItem("token");
                const response = await axiosInstance.post(
                    "/files/execute",
                    {
                        code: fileContent,
                        language: ext,
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (response.data.success) {
                    setCodeOutput(response.data.output);
                    toast.success("Code executed successfully!");
                } else {
                    setCodeOutput(`❌ Error: ${response.data.message}`);
                    toast.error("Execution failed");
                }
            } catch (error) {
                console.error("Error running code:", error);
                const errorMsg = error.response?.data?.output || error.response?.data?.message || error.message;
                setCodeOutput(`❌ Error: ${errorMsg}`);
                toast.error("Failed to execute code");
            } finally {
                setIsRunning(false);
            }
        },
        TOGGLE_AUTOSAVE: () => {
            setAutoSaveEnabled(prev => {
                const newState = !prev;
                toast.success(`AutoSave ${newState ? 'enabled' : 'disabled'}`);
                return newState;
            });
        },
        COPY_SELECTION: async () => {
            const selection = window.getSelection()?.toString();
            if (selection) {
                try {
                    await navigator.clipboard.writeText(selection);
                    toast.success("Selection copied to clipboard!");
                } catch (error) {
                    toast.error("Failed to copy selection");
                }
            } else {
                toast.error("No text selected");
            }
        },
        COPY_ALL_CODE: async () => {
            if (!fileContent) {
                toast.error("No code to copy");
                return;
            }

            try {
                await navigator.clipboard.writeText(fileContent);
                setCopied(true);
                toast.success("Code copied to clipboard!");
                
                // Reset copied state after 2 seconds
                setTimeout(() => {
                    setCopied(false);
                }, 2000);
            } catch (error) {
                console.error("Error copying code:", error);
                toast.error("Failed to copy code");
            }
        },
        TOGGLE_COPILOT: () => {
            setCopilotVisible(prev => {
                const newState = !prev;
                toast.info(`Copilot ${newState ? 'shown' : 'hidden'}`);
                return newState;
            });
        },
        NOTIFY_COLLABORATORS: () => {
            if (!isCollaborative) {
                toast.error("This is not a collaborative project");
                return;
            }
            setShowNotifyModal(true);
            toast.success("Opening notification dialog");
        }
    };

    // Dispatch action with error handling
    const dispatchAction = async (actionName) => {
        try {
            const action = actions[actionName];
            if (action) {
                await action();
            } else {
                console.error(`Action "${actionName}" not found`);
            }
        } catch (error) {
            console.error(`Error executing action "${actionName}":`, error);
            toast.error(`Failed to execute ${actionName}`);
        }
    };

    // Keyboard Shortcuts Handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger shortcuts when typing in input/textarea (except in Monaco editor)
            const target = e.target;
            const isInMonaco = target.closest('.monaco-editor');
            const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
            
            if (isInInput && !isInMonaco) {
                return;
            }

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modifier = isMac ? e.metaKey : e.ctrlKey;

            // Ctrl + S → Save File
            if (modifier && e.key === 's' && !e.shiftKey) {
                e.preventDefault();
                dispatchAction('SAVE_FILE');
            }
            // Ctrl + Enter → Run Code
            else if (modifier && e.key === 'Enter') {
                e.preventDefault();
                dispatchAction('RUN_CODE');
            }
            // Ctrl + Shift + S → Toggle AutoSave
            else if (modifier && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                dispatchAction('TOGGLE_AUTOSAVE');
            }
            // Ctrl + C → Copy Selection (only if text is selected)
            else if (modifier && e.key === 'c' && !e.shiftKey) {
                const selection = window.getSelection()?.toString();
                if (selection) {
                    // Let default copy work, but show toast
                    setTimeout(() => {
                        toast.success("Selection copied!");
                    }, 10);
                }
            }
            // Ctrl + Shift + C → Copy All Code
            else if (modifier && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                dispatchAction('COPY_ALL_CODE');
            }
            // Ctrl + P → Toggle Copilot
            else if (modifier && e.key === 'p') {
                e.preventDefault();
                dispatchAction('TOGGLE_COPILOT');
            }
            // Ctrl + Shift + N → Notify Collaborators
            else if (modifier && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                dispatchAction('NOTIFY_COLLABORATORS');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedFile, hasUnsavedChanges, isCollaborative, fileContent, copilotVisible, autoSaveEnabled]);

    // Check if current project is collaborative
    useEffect(() => {
        const checkCollaboration = async () => {
            if (!folderId) return;
            
            try {
                const token = localStorage.getItem("token");
                const response = await axiosInstance.get('/collaboration/user', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                console.log('Collaboration response:', response.data);
                const ownedProjects = response.data.ownedProjects || [];
                const sharedProjects = response.data.sharedProjects || [];
                const allCollabs = [...ownedProjects, ...sharedProjects];
                const isCollab = allCollabs.some(collab => collab.projectId?._id === folderId);
                setIsCollaborative(isCollab);
                console.log('Is collaborative:', isCollab);
            } catch (error) {
                console.error('Error checking collaboration:', error);
            }
        };
        
        checkCollaboration();
    }, [folderId]);

    // Handle notify collaborators
    const handleNotifyCollaborators = async () => {
        if (!notifyMessage.trim()) {
            toast.error("Please enter a message");
            return;
        }

        setNotifying(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axiosInstance.post('/collaboration/notify', {
                projectId: folderId,
                changeMessage: notifyMessage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(`Notified ${response.data.notifiedCount} collaborator(s)!`);
            setShowNotifyModal(false);
            setNotifyMessage("");
        } catch (error) {
            console.error('Error notifying collaborators:', error);
            toast.error(error.response?.data?.message || "Failed to notify collaborators");
        } finally {
            setNotifying(false);
        }
    };

    // Setup Intellisense for selected file language
    useEffect(() => {
        if (selectedFile) {
            const language = getFileLanguage(selectedFile.name);
            registerCompletionProvider(language);
        }
    }, [selectedFile]);

    // Auto-save effect - saves automatically after 2 seconds of inactivity
    useEffect(() => {
        if (autoSaveEnabled && hasUnsavedChanges && selectedFile && !saving) {
            // Clear existing timeout
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }

            // Set new timeout to save after 2 seconds
            autoSaveTimeoutRef.current = setTimeout(() => {
                handleSaveFile();
            }, 2000);
        }

        // Cleanup timeout on unmount or when dependencies change
        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [autoSaveEnabled, hasUnsavedChanges, fileContent, selectedFile, saving]);

    // Fetch folder structure
    useEffect(() => {
        const fetchData = async () => {
            // Skip folder structure fetch if we're opening a standalone file
            if (fileId && !folderId) {
                return;
            }
            
            setLoading(true);
            const data = await fetchFolderStructure(folderId);
            setFolderData(data?.data || null);
            setLoading(false);
        };
        fetchData();
    }, [folderId, fileId, fetchFolderStructure, refreshKey]);

    // Auto-open file if fileId is in URL query params
    useEffect(() => {
        const queryFileId = searchParams.get('fileId');
        if (queryFileId && folderData && !selectedFile) {
            // Find the file in the folder structure
            const findFileById = (node, targetId) => {
                // Check files in current node
                if (node.files) {
                    const found = node.files.find(f => f._id === targetId);
                    if (found) return found;
                }
                
                // Check subfolders recursively
                if (node.subfolders) {
                    for (const subfolder of node.subfolders) {
                        const found = findFileById(subfolder, targetId);
                        if (found) return found;
                    }
                }
                
                return null;
            };

            const file = findFileById(folderData, queryFileId);
            if (file) {
                loadFile(file);
                // Remove the fileId from URL after opening
                navigate(`/folder/${folderId}`, { replace: true });
            }
        }
    }, [folderData, searchParams, selectedFile, folderId, navigate]);

    // Load standalone file directly (for root-level files without parent folder)
    useEffect(() => {
        const loadStandaloneFile = async () => {
            if (fileId && !folderId && !selectedFile) {
                setLoading(true);
                try {
                    const token = localStorage.getItem("token");
                    
                    // Fetch file metadata first
                    const fileResponse = await axiosInstance.get(`/files/`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    
                    const file = fileResponse.data.files.find(f => f._id === fileId);
                    if (!file) {
                        toast.error("File not found");
                        navigate("/dashboard");
                        return;
                    }
                    
                    // Load the file
                    loadFile(file);
                } catch (error) {
                    console.error("Error loading standalone file:", error);
                    toast.error("Failed to load file");
                    navigate("/dashboard");
                } finally {
                    setLoading(false);
                }
            }
        };
        
        loadStandaloneFile();
    }, [fileId, folderId, selectedFile, navigate]);

    // Refresh folder structure
    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    // Fetch file content when a file is selected
    const handleFileSelect = async (file) => {
        if (hasUnsavedChanges) {
            setPendingFileSelect(file);
            setShowUnsavedConfirm(true);
            return;
        }

        loadFile(file);
    };

    const loadFile = async (file) => {
        console.log('Loading file:', file);
        setSelectedFile(file);
        setLoading(true);
        setShowOutput(false);
        setCodeOutput("");

        try {
            const token = localStorage.getItem("token");
            console.log('Fetching file content for:', file._id);
            const response = await axiosInstance.get(`/files/content/${file._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('File content response:', response.data);

            if (response.data.success) {
                const content = response.data.data.content;
                console.log('Content loaded, length:', content.length);
                setFileContent(content);
                setOriginalContent(content);
                setHasUnsavedChanges(false);
            } else {
                console.error('Failed to load file:', response.data.message);
                toast.error("Failed to load file content");
            }
        } catch (error) {
            console.error("Error fetching file content:", error);
            console.error("Error details:", error.response?.data);
            toast.error(error.response?.data?.message || "Error loading file content");
        } finally {
            setLoading(false);
        }
    };

    const handleDiscardChanges = () => {
        if (pendingFileSelect) {
            loadFile(pendingFileSelect);
            setPendingFileSelect(null);
        }
    };

    // Handle content change in editor
    const handleEditorChange = (value) => {
        setFileContent(value || "");
        setHasUnsavedChanges(value !== originalContent);
    };

    // Handle Editor mount - Setup Intellisense
    const handleEditorMount = (editor, monaco) => {
        if (selectedFile) {
            const language = getFileLanguage(selectedFile.name);
            registerCompletionProvider(language);
            
            // Enable inline suggestions
            editor.updateOptions({
                inlineSuggest: { enabled: true },
                "editor.suggest.preview": true,
                "editor.suggest.showWords": true,
                "editor.suggest.showMethods": true,
                "editor.suggest.showFunctions": true,
                "editor.suggest.showConstructors": true,
                "editor.suggest.showDeprecated": true,
            });
        }

        // Register Monaco Editor Keyboard Shortcuts
        // Ctrl+S → Save File (override Monaco's default)
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            dispatchAction('SAVE_FILE');
        });

        // Ctrl+Enter → Run Code
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            dispatchAction('RUN_CODE');
        });

        // Ctrl+Shift+S → Toggle AutoSave
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS, () => {
            dispatchAction('TOGGLE_AUTOSAVE');
        });

        // Ctrl+Shift+C → Copy All Code
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC, () => {
            dispatchAction('COPY_ALL_CODE');
        });

        // Ctrl+P → Toggle Copilot (override Monaco's quick open)
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
            dispatchAction('TOGGLE_COPILOT');
        });

        // Ctrl+Shift+N → Notify Collaborators
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyN, () => {
            dispatchAction('NOTIFY_COLLABORATORS');
        });
    };

    // Save file content
    const handleSaveFile = async () => {
        if (!selectedFile || !hasUnsavedChanges) return;

        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axiosInstance.put(
                `/files/content/${selectedFile._id}`,
                { content: fileContent },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                toast.success("File saved successfully!");
                setOriginalContent(fileContent);
                setHasUnsavedChanges(false);
            } else {
                toast.error("Failed to save file");
            }
        } catch (error) {
            console.error("Error saving file:", error);
            toast.error("Error saving file");
        } finally {
            setSaving(false);
        }
    };

    // Copy file content to clipboard
    const handleCopyCode = async () => {
        if (!fileContent) {
            toast.error("No code to copy");
            return;
        }

        try {
            await navigator.clipboard.writeText(fileContent);
            setCopied(true);
            toast.success("Code copied to clipboard!");
            
            // Reset copied state after 2 seconds
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (error) {
            console.error("Error copying code:", error);
            toast.error("Failed to copy code");
        }
    };

    // Run code in Docker
    const handleRunCode = async () => {
        if (!selectedFile || !fileContent) {
            toast.error("No code to run");
            return;
        }

        const ext = selectedFile.name.split(".").pop().toLowerCase();
        const supportedLangs = [
            "js", "jsx", "ts", "tsx", "py", "java", "c", "cpp",
            "go", "rs", "rb", "php", "cs", "swift", "kt", "pl",
            "r", "scala", "lua", "sh", "bash"
        ];

        if (!supportedLangs.includes(ext)) {
            toast.error(`Unsupported file type: .${ext}. Supported: JavaScript, TypeScript, Python, Java, C, C++, Go, Rust, Ruby, PHP, C#, Swift, Kotlin, Perl, R, Scala, Lua, Bash`);
            return;
        }

        setIsRunning(true);
        setShowOutput(true);
        setCodeOutput("⚡ Running code...");

        try {
            const token = localStorage.getItem("token");
            const response = await axiosInstance.post(
                "/files/execute",
                {
                    code: fileContent,
                    language: ext,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                setCodeOutput(response.data.output);
                toast.success("Code executed successfully!");
            } else {
                setCodeOutput(`❌ Error: ${response.data.message}`);
                toast.error("Execution failed");
            }
        } catch (error) {
            console.error("Error running code:", error);
            const errorMsg = error.response?.data?.output || error.response?.data?.message || error.message;
            setCodeOutput(`❌ Error: ${errorMsg}`);
            toast.error("Failed to execute code");
        } finally {
            setIsRunning(false);
        }
    };

    const handleCloseFile = () => {
        setSelectedFile(null);
        setFileContent("");
        setHasUnsavedChanges(false);
        setShowOutput(false);
        setCodeOutput("");
    };

    // Get file language for Monaco Editor
    const getFileLanguage = (filename) => {
        if (!filename) return "plaintext";
        const ext = filename.split(".").pop().toLowerCase();
        const languageMap = {
            js: "javascript",
            jsx: "javascript",
            ts: "typescript",
            tsx: "typescript",
            py: "python",
            java: "java",
            cpp: "cpp",
            c: "c",
            cs: "csharp",
            html: "html",
            css: "css",
            json: "json",
            xml: "xml",
            md: "markdown",
            sql: "sql",
            sh: "shell",
            bash: "shell",
            yaml: "yaml",
            yml: "yaml",
            go: "go",
            rs: "rust",
            php: "php",
            rb: "ruby",
            swift: "swift",
            kt: "kotlin",
            scala: "scala",
            pl: "perl",
            r: "r",
            lua: "lua",
        };
        return languageMap[ext] || "plaintext";
    };

    if (loading && !folderData && !selectedFile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="flex items-center gap-3">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <p className="text-gray-400 text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    if (!folderData && !selectedFile && !fileId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <p className="text-gray-400">Project not found</p>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-950 text-white">
            {/* Keyboard Shortcuts Help Modal */}
            {showShortcutsHelp && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-2xl w-full shadow-2xl animate-fade-in">
                        <div className="flex items-center justify-between p-6 border-b border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-600/20 rounded-lg">
                                    <kbd className="text-purple-400 font-bold">⌨️</kbd>
                                </div>
                                <h3 className="text-xl font-bold text-white">Keyboard Shortcuts</h3>
                            </div>
                            <button
                                onClick={() => setShowShortcutsHelp(false)}
                                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-3">
                                <ShortcutRow 
                                    keys={["Ctrl", "S"]} 
                                    description="Save current file" 
                                    icon={<Save size={16} className="text-blue-400" />}
                                />
                                <ShortcutRow 
                                    keys={["Ctrl", "Enter"]} 
                                    description="Run code in Docker" 
                                    icon={<Play size={16} className="text-green-400" />}
                                />
                                <ShortcutRow 
                                    keys={["Ctrl", "Shift", "S"]} 
                                    description="Toggle auto-save" 
                                    icon={<Zap size={16} className="text-yellow-400" />}
                                />
                                <ShortcutRow 
                                    keys={["Ctrl", "C"]} 
                                    description="Copy selected text" 
                                    icon={<Copy size={16} className="text-purple-400" />}
                                />
                                <ShortcutRow 
                                    keys={["Ctrl", "Shift", "C"]} 
                                    description="Copy all code" 
                                    icon={<Copy size={16} className="text-purple-400" />}
                                />
                                <ShortcutRow 
                                    keys={["Ctrl", "P"]} 
                                    description="Toggle AI Copilot panel" 
                                    icon={<Sparkles size={16} className="text-pink-400" />}
                                />
                                <ShortcutRow 
                                    keys={["Ctrl", "Shift", "N"]} 
                                    description="Notify collaborators" 
                                    icon={<Users size={16} className="text-orange-400" />}
                                />
                            </div>
                            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                <p className="text-sm text-gray-400">
                                    💡 <span className="text-gray-300 font-medium">Tip:</span> These shortcuts work both inside and outside the code editor for seamless workflow.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Unsaved Changes Confirmation */}
            <ConfirmDialog
                isOpen={showUnsavedConfirm}
                onClose={() => {
                    setShowUnsavedConfirm(false);
                    setPendingFileSelect(null);
                }}
                onConfirm={handleDiscardChanges}
                title="Unsaved Changes"
                message="You have unsaved changes. Do you want to discard them and continue?"
                type="warning"
            />

            {/* Close File Confirmation */}
            <ConfirmDialog
                isOpen={showCloseConfirm}
                onClose={() => setShowCloseConfirm(false)}
                onConfirm={handleCloseFile}
                title="Close File?"
                message="You have unsaved changes. Close anyway?"
                type="warning"
            />

            {/* Header */}
            <header className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Dashboard</span>
                    </button>
                    <div className="h-6 w-px bg-gray-800" />
                    <div className="flex items-center gap-2">
                        <Code2 size={20} className="text-blue-400" />
                        <h1 className="text-lg font-bold text-white">
                            {folderData ? folderData.name : (selectedFile ? selectedFile.name : "Editor")}
                        </h1>
                    </div>
                    <div className="h-6 w-px bg-gray-800" />
                    <button
                        onClick={() => setCopilotVisible(!copilotVisible)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all text-sm ${
                            copilotVisible
                                ? "bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30"
                                : "bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700"
                        }`}
                        title={copilotVisible ? "Hide Copilot (Ctrl+P)" : "Show Copilot (Ctrl+P)"}
                    >
                        <MessageSquare size={16} />
                        <span>{copilotVisible ? "Copilot" : "Show Copilot"}</span>
                    </button>
                    
                    <button
                        onClick={() => setShowShortcutsHelp(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all text-sm bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white"
                        title="View Keyboard Shortcuts"
                    >
                        <Keyboard size={16} />
                    </button>
                </div>

                {selectedFile && (
                    <div className="flex items-center gap-3">
                        {isCollaborative && (
                            <button
                                onClick={() => setShowNotifyModal(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-teal-600/20 border border-teal-500/30 text-teal-400 rounded-lg font-medium hover:bg-teal-600/30 transition-all text-sm"
                                title="Notify collaborators of changes (Ctrl+Shift+N)"
                            >
                                <MessageSquare size={14} />
                                <span>Notify Collaborators</span>
                            </button>
                        )}

                        {hasUnsavedChanges && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-orange-400 font-medium">
                                    {autoSaveEnabled ? "Auto-saving..." : "Unsaved"}
                                </span>
                            </div>
                        )}

                        <button
                            onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                autoSaveEnabled
                                    ? "bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30"
                                    : "bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700"
                            }`}
                            title={autoSaveEnabled ? "Auto-save is ON (Ctrl+Shift+S to toggle)" : "Auto-save is OFF (Ctrl+Shift+S to toggle)"}
                        >
                            <Zap size={14} className={autoSaveEnabled ? "" : "opacity-50"} />
                            <span>{autoSaveEnabled ? "Auto-save ON" : "Auto-save OFF"}</span>
                        </button>

                        <button
                            onClick={handleSaveFile}
                            disabled={!hasUnsavedChanges || saving || (autoSaveEnabled && hasUnsavedChanges)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${hasUnsavedChanges && !saving && !autoSaveEnabled
                                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                                }`}
                            title="Save File (Ctrl+S)"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>Save</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleCopyCode}
                            disabled={!fileContent}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${fileContent
                                    ? copied
                                        ? "bg-green-600 text-white"
                                        : "bg-purple-600 hover:bg-purple-700 text-white"
                                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                                }`}
                            title="Copy All Code (Ctrl+Shift+C)"
                        >
                            {copied ? (
                                <>
                                    <Check size={16} />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy size={16} />
                                    <span>Copy Code</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleRunCode}
                            disabled={isRunning}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isRunning
                                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:scale-105 shadow-lg shadow-green-500/20"
                                }`}
                            title="Run Code (Ctrl+Enter)"
                        >
                            {isRunning ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>Running...</span>
                                </>
                            ) : (
                                <>
                                    <Play size={16} />
                                    <span>Run Code</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </header>

            {/* Main Content - Split Pane */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - File Tree (only show if we have folder data) */}
                {folderData && (
                    <aside className="w-80 bg-gray-900 border-r border-gray-800 overflow-y-auto">
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
                                <Folder className="text-yellow-500" size={18} />
                                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                                    Explorer
                                </h2>
                            </div>
                            <FileTreeNode
                                node={folderData}
                                onFileSelect={handleFileSelect}
                                selectedFileId={selectedFile?._id}
                                onRefresh={handleRefresh}
                            />
                        </div>
                    </aside>
                )}

                {/* Center Panel - Code Editor and Copilot Wrapper */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Code Editor Section */}
                    <main className="flex-1 flex flex-col bg-[#1e1e1e]">
                    {selectedFile ? (
                        <>
                            {/* File Tab */}
                            <div className="bg-[#252526] px-4 py-2 flex items-center justify-between border-b border-gray-800">
                                <div className="flex items-center gap-2">
                                    <FileIcon size={14} className="text-gray-400" />
                                    <span className="text-sm text-gray-300">{selectedFile.name}</span>
                                    {hasUnsavedChanges && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        if (hasUnsavedChanges) {
                                            setShowCloseConfirm(true);
                                        } else {
                                            handleCloseFile();
                                        }
                                    }}
                                    className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Editor */}
                            <div className={showOutput ? "h-1/2" : "flex-1"}>
                                <Editor
                                    height="100%"
                                    language={getFileLanguage(selectedFile.name)}
                                    value={fileContent}
                                    onChange={handleEditorChange}
                                    onMount={handleEditorMount}
                                    theme="vs-dark"
                                    options={{
                                        fontSize: 14,
                                        fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                                        minimap: { enabled: true },
                                        scrollBeyondLastLine: false,
                                        wordWrap: "on",
                                        automaticLayout: true,
                                        lineNumbers: "on",
                                        renderWhitespace: "selection",
                                        cursorBlinking: "smooth",
                                        smoothScrolling: true,
                                        // Intellisense options
                                        quickSuggestions: {
                                            other: true,
                                            comments: false,
                                            strings: false,
                                        },
                                        suggestOnTriggerCharacters: true,
                                        acceptSuggestionOnCommitCharacter: true,
                                        acceptSuggestionOnEnter: "on",
                                        snippetSuggestions: "top",
                                        wordBasedSuggestions: true,
                                    }}
                                />
                            </div>

                            {/* Output Panel */}
                            {showOutput && (
                                <div className="h-1/2 border-t border-gray-800 flex flex-col bg-[#1e1e1e]">
                                    <div className="bg-[#252526] px-4 py-2 flex items-center justify-between border-b border-gray-800">
                                        <div className="flex items-center gap-2">
                                            <Terminal size={14} className="text-green-400" />
                                            <span className="text-sm text-gray-300 font-medium">Output</span>
                                            {isRunning && (
                                                <Zap size={14} className="text-yellow-400 animate-pulse" />
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowOutput(false);
                                                setCodeOutput("");
                                            }}
                                            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="flex-1 p-4 overflow-auto bg-[#1e1e1e]">
                                        <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                                            {codeOutput || "No output yet. Click 'Run Code' to execute."}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="inline-flex p-6 bg-gray-900 rounded-full mb-6">
                                    <Code2 size={48} className="text-gray-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-300 mb-2">No File Selected</h3>
                                <p className="text-gray-500 mb-6">
                                    Choose a file from the explorer to start coding
                                </p>
                                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <FilePlus size={16} />
                                        <span>Create new file</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Play size={16} />
                                        <span>Run code</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    </main>

                    {/* Right Panel - Copilot Chat */}
                    {copilotVisible && (
                        <aside className="w-96 bg-gray-900 border-l border-gray-800 overflow-hidden flex flex-col">
                            {/* Copilot Header with Close Button */}
                            <div className="bg-gray-800/50 px-4 py-3 flex items-center justify-between border-b border-gray-800">
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={18} className="text-purple-400" />
                                    <h3 className="text-sm font-semibold text-gray-300">AI Copilot</h3>
                                </div>
                                <button
                                    onClick={() => setCopilotVisible(false)}
                                    className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
                                    title="Close Copilot"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <CopilotChat 
                                    currentFile={selectedFile} 
                                    fileContent={fileContent}
                                    folderId={folderId}
                                    onRefresh={handleRefresh}
                                />
                            </div>
                        </aside>
                    )}
                </div>
            </div>

            {/* Notification Modal */}
            {showNotifyModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-2 text-white">Notify Collaborators</h2>
                        <p className="text-gray-400 text-sm mb-4">
                            Send an email notification to all collaborators about your changes
                        </p>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Change Message
                            </label>
                            <textarea
                                value={notifyMessage}
                                onChange={(e) => setNotifyMessage(e.target.value)}
                                placeholder="Describe what you changed in the project..."
                                rows="4"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-white placeholder-gray-500 resize-none"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowNotifyModal(false);
                                    setNotifyMessage("");
                                }}
                                className="px-5 py-2.5 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-all text-white font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleNotifyCollaborators}
                                disabled={notifying}
                                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                                    notifying
                                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:scale-105 text-white"
                                }`}
                            >
                                {notifying ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="animate-spin" size={16} />
                                        Sending...
                                    </span>
                                ) : (
                                    "Send Notification"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FolderEditor;
