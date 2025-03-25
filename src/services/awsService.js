import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { config } from "../config/config.js";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";

const s3 = new S3Client({
  region: config.BUCKET_REGION,
  credentials: {
    accessKeyId: config.ACCESS_KEY,
    secretAccessKey: config.SECRET_ACCESS_KEY,
  },
});

export const addFile = async (folder = "general", file) => {
  console.log("File" , file);
  const filePath = file.path; // Get file path from multer
  const fileName = file.filename; // Get the stored file name



  try {
    const fileStream = fs.createReadStream(filePath);

    const upload = new Upload({
      client: s3,
      params: {
        Bucket: config.BUCKET_NAME,
        Key: `${folder}/${fileName}`, // File name you want to save as in S3
        Body: fileStream, // Pass the file stream
        ContentType: file.mimetype,
      },
    });

    await upload.done();

    return folder + "/" + fileName;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  } finally {
    fs.unlinkSync(filePath);
  }
};

export const deleteFile = async (fileName) => {
  const params = {
    Bucket: config.BUCKET_NAME,
    Key: fileName,
  };

  try {
    await s3.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.log("Error", error);
  }
};

export const getFileSignedUrl = async (fileName) => {
  const command = new GetObjectCommand({
    Bucket: config.BUCKET_NAME,
    Key: fileName,
    region: config.BUCKET_REGION,
  });

  const signedUrl = await getSignedUrl(s3, command);

  return signedUrl;
};
