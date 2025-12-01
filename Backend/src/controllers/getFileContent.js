import { File } from "../models/File.js";
import { Folder } from "../models/Folder.js";
import { Collaboration } from "../models/Collaboration.js";
import { minioClient } from "../config/minioClient.js";

export const getFileContent = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.user._id;

        // Find the file in database
        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        // Check if user owns the file OR is a collaborator
        let hasAccess = file.owner.toString() === userId.toString();
        
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
                    'collaborators.userId': userId
                }).lean();
                
                hasAccess = !!collaboration;
            }
        }
        
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access"
            });
        }

        // Get file from MinIO
        const bucketName = process.env.BUCKET_NAME || "cloud-storage";

        // Stream the file from MinIO
        const dataStream = await minioClient.getObject(bucketName, file.fileUrl);

        // Convert stream to buffer
        const chunks = [];
        for await (const chunk of dataStream) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        const content = buffer.toString('utf-8');

        res.status(200).json({
            success: true,
            data: {
                content,
                name: file.name,
                type: file.type,
                size: file.size
            }
        });

    } catch (error) {
        console.error("Error fetching file content:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching file content",
            error: error.message
        });
    }
};
