import mongoose from "mongoose";

const collaborationSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    required: true
  },
  
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  projectName: {
    type: String,
    required: true
  },
  
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    email: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["editor", "viewer"],
      default: "editor"
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  isActive: {
    type: Boolean,
    default: true
  }
  
}, { timestamps: true });

// Index for faster queries
collaborationSchema.index({ owner: 1 });
collaborationSchema.index({ "collaborators.userId": 1 });
collaborationSchema.index({ projectId: 1 });

export const Collaboration = mongoose.model("Collaboration", collaborationSchema);
