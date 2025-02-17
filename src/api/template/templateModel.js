import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
    mediaFiles: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          required: true,
          enum: ["image", "pdf", "video", "other"],
        },
      },
    ],
  },
  { timestamps: true }
);

const Template = mongoose.model("Template", templateSchema);

export default Template;
