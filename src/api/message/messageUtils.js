import {
  sendText,
  sendImage,
  sendFile,
} from "../../services/waboxappService.js";
import { getFileSignedUrl } from "../../services/awsService.js";
import { logDebug, logError, logInfo } from "../../utils/logger.js";

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
    logDebug(
      `WABOXAPP : Sent text message to ${phone} with ID ${message_id} & status ${message.status}`
    );
  } catch (error) {
    logError(error);
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

    logDebug(
      `WABOXAPP : Sent image message to ${phone} with ID ${message_id} & status ${message.status}`
    );
  } catch (error) {
    logError(error);
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
    logDebug(
      `WABOXAPP : Sent file message to ${phone} with ID ${message_id} & status ${message.status}`
    );
  } catch (error) {
    logError(error);
  }
};
