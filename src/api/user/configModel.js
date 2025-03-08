import mongoose from "mongoose";

const configSchema = new mongoose.Schema(
  {
    defaultUser: {
      type: String,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Config = mongoose.model("Config", configSchema);

export default Config;
