import {minioClient} from '../config/minioClient.js'
import {config} from 'dotenv'
import { Folder } from '../models/Folder.js'
import { Collaboration } from '../models/Collaboration.js'
config()

export const createFolder = async (req,res)=>{
    const {folderName,parentId} = req.body
    if(!folderName){
        return res.status(401).json({
            success : false,
            message : "FolderName Required"
        })
    }
    try{
        const userId = req.user._id;
        let folderPath = folderName + "/";
        let folderOwner = userId;
        
        if (parentId) {
            // If subfolder, fetch parent folder
            const parentFolder = await Folder.findById(parentId);
            if (!parentFolder) {
                return res.status(404).json({
                success: false,
                message: "Parent folder not found"
                });
            }
            
            // Check if user owns the parent folder OR is a collaborator
            let hasAccess = parentFolder.owner.toString() === userId.toString();
            
            if (!hasAccess) {
                // Find the root folder
                let currentFolderId = parentId;
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
            
            folderPath = parentFolder.path + folderName + "/";
            folderOwner = parentFolder.owner; // Use parent folder owner
        }
        
        await minioClient.putObject(process.env.BUCKET_NAME,folderPath,"")
        const newFolder = new Folder({name : folderName,owner : folderOwner,path : folderPath,parentId:parentId || null })
        await newFolder.save()
        console.log(`Folder "${folderName}" created successfully`);
        return res.status(200).json({
            success : true,
            message :"Folder created successfully",
            folder: newFolder
        })
    }catch(err){
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Error creating folder",
            error: err.message
        });
    }
}