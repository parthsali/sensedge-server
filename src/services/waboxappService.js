import { config } from "../config/config.js";
import axios from 'axios';

export const sendText = async (phone, message_id, text) => {
    try {
        const uid = config.WABOXAPP_UID;
        const token = config.WABOXAPP_TOKEN;

        const url = `${config.WABOXAPP_ENDPOINT}/send/chat`;

        console.log(url);

        const response = await axios.post(url, null, {
            params: {
                uid: uid,
                token: token,
                to: phone,
                custom_uid: message_id,
                text: text
            }
        });

        console.log("Response Data", response.data);

        const data = response.data;

        if (data.success) {
            return { success: true, custom_uid: data.custom_uid };
        } else {
            throw new Error('Message not sent');
        }
    } catch (error) {
        console.log(error);
        return { success: false, error: error.message };
    }
}