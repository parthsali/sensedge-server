import { config } from "../config/config.js";
import axios from "axios";
import { logError } from "../utils/logger.js";

export const sendText = async (phone, message_id, text) => {
  try {
    const uid = config.WABOXAPP_UID;
    const token = config.WABOXAPP_TOKEN;

    const url = `${config.WABOXAPP_ENDPOINT}/send/chat`;

    const response = await axios.post(url, null, {
      params: {
        uid: uid,
        token: token,
        to: phone,
        custom_uid: message_id,
        text: text,
      },
    });

    const data = response.data;

    if (data.success) {
      return { success: true, custom_uid: data.custom_uid };
    } else {
      throw new Error("Message not sent");
    }
  } catch (error) {
    logError(error);
    return { success: false, error: error.message };
  }
};

export const sendImage = async (phone, message_id, image_url) => {
  try {
    const uid = config.WABOXAPP_UID;
    const token = config.WABOXAPP_TOKEN;

    const url = `${config.WABOXAPP_ENDPOINT}/send/image`;

    const response = await axios.post(url, null, {
      params: {
        uid: uid,
        token: token,
        to: phone,
        custom_uid: message_id,
        url: image_url,
      },
    });

    const data = response.data;

    if (data.success) {
      return { success: true, custom_uid: data.custom_uid };
    } else {
      throw new Error("Image not sent");
    }
  } catch (error) {
    logError(error);
    return { success: false, error: error.message };
  }
};

export const sendFile = async (phone, message_id, file_url) => {
  try {
    const uid = config.WABOXAPP_UID;
    const token = config.WABOXAPP_TOKEN;

    const url = `${config.WABOXAPP_ENDPOINT}/send/media`;

    const response = await axios.post(url, null, {
      params: {
        uid: uid,
        token: token,
        to: phone,
        custom_uid: message_id,
        url: file_url,
      },
    });

    const data = response.data;

    if (data.success) {
      return { success: true, custom_uid: data.custom_uid };
    } else {
      throw new Error("File not sent");
    }
  } catch (error) {
    logError(error);
    return { success: false, error: error.message };
  }
};
