import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  // We will store the HASHED password here, never the plain text
  password: {
    type: String,
    required: true
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  drawingData: {
    type: Array, // Array of JSON objects representing lines
    default: []
  }
}, { timestamps: true });

export const Room = mongoose.model("Room", roomSchema);
