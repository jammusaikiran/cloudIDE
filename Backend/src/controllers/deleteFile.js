import { File } from "../models/File.js";
import { Folder } from "../models/Folder.js";
import { Collaboration } from "../models/Collaboration.js";
import { minioClient } from "../config/minioClient.js";

export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({ success: false, message: "fileId is required" });
    }
    
    // Find file
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }
    
    // Check if user owns the file OR is a collaborator
    let hasAccess = file.owner.toString() === req.user._id.toString();
    
    if (!hasAccess) {
      // Find the root folder by traversing up the folder tree
      let currentFolderId = file.parentId;
      let rootFolderId = null;
      
      while (currentFolderId) {
        const folder = await Folder.findById(currentFolderId);
        if (!folder) break;
        
        if (folder.parentId === null) {
          // This is the root folder
          rootFolderId = folder._id;
          break;
        }
        currentFolderId = folder.parentId;
      }
      
      // Check if user is a collaborator on the root folder
      if (rootFolderId) {
        const collaboration = await Collaboration.findOne({
          projectId: rootFolderId,
          'collaborators.userId': req.user._id
        }).lean();
        
        hasAccess = !!collaboration;
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    // Delete file from MinIO
    try {
      await minioClient.removeObject(process.env.BUCKET_NAME, file.path);
      console.log("Deleted file from MinIO:", file.path);
    } catch (err) {
      console.error("Failed to delete file from MinIO:", file.path, err);
      return res.status(500).json({ success: false, message: "Failed to delete file from storage", error: err.message });
    }

    // Delete file document from MongoDB
    await File.findByIdAndDelete(fileId);
    console.log("Deleted file from MongoDB:", file.name);

    return res.status(200).json({
      success: true,
      message: "File deleted successfully"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting file",
      error: err.message
    });
  }
};
