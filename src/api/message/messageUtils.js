import {
  sendText,
  sendImage,
  sendFile,
} from "../../services/waboxappService.js";
import { getFileSignedUrl } from "../../services/awsService.js";

export const sendTextMessage = async (message, customer) => {
  try {
    const phone = customer.phone;
    const message_id = message._id;
    const text = message.text;
    const response = await sendText(phone, message_id, text);

    if (!response.success) {
      message.status = "failed";
      await message.save();
    }
  } catch (error) {
    console.error("Error sending text message:", error);
  }
};

export const sendImageMessage = async (message, customer) => {
  try {
    const phone = customer.phone;
    const message_id = message._id;
    const image_url = await getFileSignedUrl(message.url);
    const response = await sendImage(phone, message_id, image_url);

    if (!response.success) {
      message.status = "failed";
      await message.save();
    }
  } catch (error) {
    console.error("Error sending image message:", error);
  }
};

export const sendFileMessage = async (message, customer) => {
  try {
    const phone = customer.phone;
    const message_id = message._id;
    const file_url = await getFileSignedUrl(message.url);
    const response = await sendFile(phone, message_id, file_url);

    if (!response.success) {
      message.status = "failed";
      await message.save();
    }
  } catch (error) {
    console.error("Error sending file message:", error);
  }
};
