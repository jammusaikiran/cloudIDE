import multer from "multer";
import { minioClient } from "../config/minioClient.js";
import { File } from "../models/File.js";
import { Folder } from "../models/Folder.js";
import { Collaboration } from "../models/Collaboration.js";

// Controller
export const uploadFile = async (req, res) => {
  try {
    const userId = req.user._id; // set by auth middleware
    const { folderId } = req.body;

    // Support single or multiple files
    const files = req.files || (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    // Determine folder path
    let parentFolderId = null;
    let folderPath = ""; // default root
    let fileOwner = userId; // Default owner is the uploader

    if (folderId) {
      const parentFolder = await Folder.findById(folderId);
      if (!parentFolder) {
        return res.status(404).json({ success: false, message: "Folder not found" });
      }
      
      // Check if user owns the folder OR is a collaborator
      let hasAccess = parentFolder.owner.toString() === userId.toString();
      
      if (!hasAccess) {
        // Find the root folder
        let currentFolderId = folderId;
        let rootFolderId = null;
        
        while (currentFolderId) {
          const folder = await Folder.findById(currentFolderId);
          if (!folder) break;
          
          if (folder.parentId === null) {
            rootFolderId = folder._id;
            break;
          }
          currentFolderId = folder.parentId;
        }
        
        // Check if user is a collaborator on the root folder
        if (rootFolderId) {
          const collaboration = await Collaboration.findOne({
            projectId: rootFolderId,
            'collaborators.userId': userId
          }).lean();
          
          hasAccess = !!collaboration;
        }
      }
      
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Unauthorized access" });
      }
      
      folderPath = parentFolder.path.endsWith("/") ? parentFolder.path : parentFolder.path + "/";
      parentFolderId = parentFolder._id;
      fileOwner = parentFolder.owner; // Use the folder owner as file owner
    }

    const uploadedFiles = [];

    for (const file of files) {
      const objectName = folderPath + file.originalname;

      // Upload to MinIO
      await minioClient.putObject(process.env.BUCKET_NAME, objectName, file.buffer, file.size);

      // Save metadata in MongoDB
      const newFile = new File({
        name: file.originalname,
        owner: fileOwner,
        parentId: parentFolderId,
        fileUrl: objectName,
        size: file.size,
        type: file.mimetype,
        path: objectName,
      });

      await newFile.save();
      uploadedFiles.push(newFile);
    }

    return res.status(201).json({
      success: true,
      message: "Files uploaded successfully",
      files: uploadedFiles,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error uploading files",
      error: err.message,
    });
  }
};