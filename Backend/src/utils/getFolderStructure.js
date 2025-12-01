import mongoose from "mongoose";
import { Folder } from "../models/Folder.js";
import { File } from "../models/File.js";
import { Collaboration } from "../models/Collaboration.js";

export const getFolderStructure = async (folderId, ownerId) => {
  console.log('getFolderStructure called with:', { folderId, ownerId });
  const objectId = new mongoose.Types.ObjectId(folderId);

  // Find the current folder - first check if user is owner
  let folder = await Folder.findOne({ _id: objectId, owner: ownerId }).lean();
  console.log('Folder with owner check:', folder);
  
  // If not owner, check if user is a collaborator
  if (!folder) {
    console.log('Not owner, checking if collaborator...');
    const collaboration = await Collaboration.findOne({
      projectId: objectId,
      'collaborators.userId': ownerId
    }).lean();
    console.log('Collaboration found:', collaboration);
    
    if (collaboration) {
      // User is a collaborator, fetch the folder without owner check
      folder = await Folder.findOne({ _id: objectId }).lean();
      console.log('Folder without owner check:', folder);
    }
  }
  
  if (!folder) {
    console.log('Folder not found after all checks');
    return null;
  }

  // Get the actual owner of the folder for fetching subfolders/files
  const folderOwnerId = folder.owner;

  // Get subfolders correctly
  const subfolders = await Folder.find({ parentId: objectId, owner: folderOwnerId }).lean();

  // Get all files inside this folder
  const files = await File.find({ parentId: objectId, owner: folderOwnerId }).lean();

  // Build children recursively
  const children = await Promise.all(
    subfolders.map(async (sub) => await getFolderStructure(sub._id, ownerId))
  );

  return {
    _id: folder._id,
    name: folder.name,
    path: folder.path,
    type: "folder",
    files: files.map(f => ({
      _id: f._id,
      name: f.name,
      fileUrl: f.fileUrl,
      size: f.size,
      type: f.type,
      path: f.path,
    })),
    subfolders: children.filter(c => c !== null),
  };
};
