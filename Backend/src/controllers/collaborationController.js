import { Collaboration } from "../models/Collaboration.js";
import { Folder } from "../models/Folder.js";
import { User } from "../models/User.js";
import { sendCollaborationEmail, sendChangeNotificationEmail } from "../utils/emailService.js";

// Create a new collaboration for a project
export const createCollaboration = async (req, res) => {
  try {
    const { projectId, collaboratorEmails } = req.body;
    const userId = req.user._id;
    
    // First check if project exists
    const project = await Folder.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }
    
    // Check if user owns the project OR is already a collaborator with permission
    const isOwner = project.owner.toString() === userId.toString();
    
    if (!isOwner) {
      // Check if collaboration exists and user is the owner of the collaboration
      const existingCollab = await Collaboration.findOne({ projectId });
      const isCollabOwner = existingCollab && existingCollab.owner.toString() === userId.toString();
      
      if (!isCollabOwner) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to add collaborators to this project"
        });
      }
    }
    
    // Check if collaboration already exists
    let collaboration = await Collaboration.findOne({ projectId });
    let message;
    
    if (collaboration) {
      // Add new collaborators to existing collaboration
      const newCollaborators = [];
      const duplicates = [];
      
      for (const email of collaboratorEmails) {
        // Check if already a collaborator
        const exists = collaboration.collaborators.some(c => c.email === email);
        if (exists) {
          duplicates.push(email);
        } else {
          const user = await User.findOne({ email });
          newCollaborators.push({
            userId: user?._id || null,
            email: email,
            role: "editor"
          });
          
          // Send invitation email
          try {
            console.log(`📧 Sending invitation email to ${email} for project "${project.name}"`);
            await sendCollaborationEmail(email, req.user.email, project.name);
          } catch (emailError) {
            console.error(`Failed to send email to ${email}:`, emailError.message);
          }
        }
      }
      
      if (duplicates.length > 0 && newCollaborators.length === 0) {
        return res.status(400).json({
          success: false,
          message: `User(s) already exist: ${duplicates.join(', ')}`
        });
      }
      
      collaboration.collaborators.push(...newCollaborators);
      await collaboration.save();
      
      message = duplicates.length > 0 
        ? `Added ${newCollaborators.length} collaborator(s). Already exists: ${duplicates.join(', ')}`
        : `Added ${newCollaborators.length} collaborator(s) successfully`;
      
    } else {
      // Create new collaboration
      const collaborators = [];
      
      for (const email of collaboratorEmails) {
        const user = await User.findOne({ email });
        collaborators.push({
          userId: user?._id || null,
          email: email,
          role: "editor"
        });
        
        // Send invitation email
        try {
          console.log(`📧 Sending invitation email to ${email} for project "${project.name}"`);
          await sendCollaborationEmail(email, req.user.email, project.name);
        } catch (emailError) {
          console.error(`Failed to send email to ${email}:`, emailError.message);
        }
      }
      
      collaboration = new Collaboration({
        projectId,
        owner: userId,
        projectName: project.name,
        collaborators
      });
      
      await collaboration.save();
      
      message = `Added ${collaborators.length} collaborator(s) successfully`;
    }
    
    // Ensure message has a value
    if (!message) {
      message = "Collaborators added successfully";
    }
    
    return res.status(201).json({
      success: true,
      message: message,
      collaboration
    });
    
  } catch (error) {
    console.error("Error creating collaboration:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating collaboration",
      error: error.message
    });
  }
};

// Get all collaborations where user is owner or collaborator
export const getUserCollaborations = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email;
    
    // Find collaborations where user is owner
    const ownedCollaborations = await Collaboration.find({ 
      owner: userId,
      isActive: true 
    }).populate('owner', 'email')
      .populate('projectId', 'name');
    
    // Find collaborations where user is a collaborator
    const sharedCollaborations = await Collaboration.find({
      'collaborators.email': userEmail,
      isActive: true
    }).populate('owner', 'email')
      .populate('projectId', 'name');
    
    return res.status(200).json({
      success: true,
      ownedProjects: ownedCollaborations,
      sharedProjects: sharedCollaborations
    });
    
  } catch (error) {
    console.error("Error fetching collaborations:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching collaborations",
      error: error.message
    });
  }
};

// Remove a collaborator from a project
export const removeCollaborator = async (req, res) => {
  try {
    const { collaborationId, collaboratorEmail } = req.body;
    const userId = req.user._id;
    
    const collaboration = await Collaboration.findById(collaborationId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: "Collaboration not found"
      });
    }
    
    // Check if user is the collaboration owner
    if (collaboration.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to remove collaborators"
      });
    }
    
    collaboration.collaborators = collaboration.collaborators.filter(
      c => c.email !== collaboratorEmail
    );
    
    await collaboration.save();
    
    return res.status(200).json({
      success: true,
      message: "Collaborator removed successfully",
      collaboration
    });
    
  } catch (error) {
    console.error("Error removing collaborator:", error);
    return res.status(500).json({
      success: false,
      message: "Error removing collaborator",
      error: error.message
    });
  }
};

// Send notification to collaborators about project changes
export const notifyCollaborators = async (req, res) => {
  try {
    const { projectId, changeMessage } = req.body;
    const userId = req.user._id;
    const userName = req.user.email;
    
    const collaboration = await Collaboration.findOne({ 
      projectId 
    }).populate('owner', 'email');
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: "This project is not in collaboration mode"
      });
    }
    
    // Check if user has permission (owner or collaborator)
    const isOwner = collaboration.owner._id.toString() === userId.toString();
    const isCollaborator = collaboration.collaborators.some(
      c => c.userId && c.userId.toString() === userId.toString()
    );
    
    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to notify collaborators"
      });
    }
    
    // Send email to all collaborators except the one who made the change
    const recipients = [];
    
    // Add owner if not the one making changes
    if (!isOwner) {
      recipients.push(collaboration.owner.email);
    }
    
    // Add all collaborators except the one making changes
    collaboration.collaborators.forEach(c => {
      if (!c.userId || c.userId.toString() !== userId.toString()) {
        recipients.push(c.email);
      }
    });
    
    // Send notification emails
    for (const email of recipients) {
      await sendChangeNotificationEmail(
        email,
        userName,
        collaboration.projectName,
        changeMessage
      );
    }
    
    return res.status(200).json({
      success: true,
      message: `Notifications sent to ${recipients.length} collaborator(s)`,
      notifiedCount: recipients.length,
      recipients
    });
    
  } catch (error) {
    console.error("Error notifying collaborators:", error);
    return res.status(500).json({
      success: false,
      message: "Error sending notifications",
      error: error.message
    });
  }
};

// Get all registered users (for sharing)
export const getRegisteredUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    console.log('Fetching users, current user ID:', currentUserId);
    
    // Get all users except current user
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('email username')
      .sort({ email: 1 });
    
    console.log('Found users:', users.length);
    
    return res.status(200).json({
      success: true,
      users
    });
    
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message
    });
  }
};

// Create a new collaborative project
export const createCollaborativeProject = async (req, res) => {
  try {
    const { projectName, collaboratorEmails } = req.body;
    const userId = req.user._id;
    
    console.log('Creating collaborative project:', { projectName, collaboratorEmails, userId });
    
    if (!projectName || !projectName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project name is required"
      });
    }
    
    // Create new folder/project
    console.log('Creating folder...');
    const newProject = await Folder.create({
      name: projectName.trim(),
      owner: userId,
      parentId: null,
      path: `/${projectName.trim()}`
    });
    console.log('Folder created:', newProject._id);
    
    // Create collaboration for this project
    const collaborators = [];
    
    if (collaboratorEmails && collaboratorEmails.length > 0) {
      console.log('Adding collaborators:', collaboratorEmails);
      for (const email of collaboratorEmails) {
        const user = await User.findOne({ email });
        console.log('Found user for email', email, ':', user?._id);
        collaborators.push({
          userId: user?._id || null,
          email: email,
          role: "editor"
        });
        
        // Send invitation email
        await sendCollaborationEmail(email, req.user.email, projectName);
      }
    }
    
    console.log('Creating collaboration record...');
    const collaboration = await Collaboration.create({
      projectId: newProject._id,
      owner: userId,
      projectName: projectName.trim(),
      collaborators: collaborators,
      isActive: true
    });
    console.log('Collaboration created:', collaboration._id);
    
    const populatedCollaboration = await Collaboration.findById(collaboration._id)
      .populate('owner', 'email')
      .populate('projectId', 'name');
    
    return res.status(201).json({
      success: true,
      message: "Collaborative project created successfully",
      collaboration: populatedCollaboration,
      project: newProject
    });
    
  } catch (error) {
    console.error("Error creating collaborative project:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Error creating collaborative project",
      error: error.message
    });
  }
};
