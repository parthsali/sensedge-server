import createHttpError from "http-errors";
import Message from "./messageModel.js";
import { sendMessageSchema, sendTemplateSchema } from "./messageValidation.js";
import { addFile } from "../../services/awsService.js";
import Conversation from "../conversation/conversationModel.js";
import Template from "../template/templateModel.js";
import { getFileSignedUrl } from "../../services/awsService.js";
import Config from "../user/configModel.js";
import Customer from "../customer/customerModel.js";
import { customAlphabet } from "nanoid";
import {
  sendImage,
  sendText,
  sendFile,
} from "../../services/waboxappService.js";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

export const sendMessage = async (req, res, next) => {
  try {
    const { error } = sendMessageSchema.validate(req.body);

    if (error) {
      throw createHttpError(400, error.message);
    }

    const { conversationId, type } = req.body;

    if (!["text", "image", "video", "file"].includes(type)) {
      throw createHttpError(400, "Invalid message type");
    }

    const user = req.user;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw createHttpError(404, "Conversation not found");
    }

    if (
      conversation.user.toString() !== req.user._id.toString() &&
      user.role !== "admin"
    ) {
      throw createHttpError(
        403,
        "You are not allowed to send messages to this conversation"
      );
    }

    const author = user._id;

    if (type === "text") {
      const { text } = req.body;

      const customer = await Customer.findById(conversation.customer);

      if (!customer) {
        throw createHttpError(404, "Customer not found");
      }

      const newMessage = new Message({
        _id: `message-${nanoid()}`,
        conversation: conversationId,
        author,
        type: "text",
        text,
        status: "sent",
      });

      await newMessage.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: newMessage._id,
      });

      const response = await sendText(customer.phone, newMessage._id, text);

      if (!response.success) {
        newMessage.status = "failed";
        await newMessage.save();

        const messageData = await Message.findOne({
          _id: newMessage._id,
        }).populate("author", "name");

        sendMessageToUser(conversation.user, messageData);

        throw createHttpError(500, "Message not sent");
      }

      const messageData = await Message.findOne({
        _id: newMessage._id,
      }).populate("author", "name");

      sendMessageToUser(conversation.user, messageData);

      return res.status(201).json({ message: newMessage });
    }

    const file = req.file;

    if (!file) {
      throw createHttpError(400, "File is required");
    }

    const uploadedFile = await addFile("messages", file);

    const newMessage = new Message({
      _id: `message-${nanoid()}`,
      conversation: conversationId,
      author,
      type,
      name: file.originalname,
      size: file.size,
      url: uploadedFile,
      mimeType: file.mimetype,
    });

    await newMessage.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id,
    });

    const customer = await Customer.findById(conversation.customer);

    if (!customer) {
      throw createHttpError(404, "Customer not found");
    }

    const fileUrl = await getFileSignedUrl(newMessage.url);

    if (type === "image") {
      const response = await sendImage(customer.phone, newMessage._id, fileUrl);
      if (!response.success) {
        newMessage.status = "failed";
        await newMessage.save();

        const messageData = await Message.findOne({
          _id: newMessage._id,
        }).populate("author", "name");

        messageData.url = await getFileSignedUrl(messageData.url);

        sendMessageToUser(conversation.user, messageData);

        throw createHttpError(500, "Message not sent");
      }
    } else {
      const response = await sendFile(customer.phone, newMessage._id, fileUrl);
      if (!response.success) {
        newMessage.status = "failed";
        await newMessage.save();
        const messageData = await Message.findOne({
          _id: newMessage._id,
        }).populate("author", "name");

        messageData.url = await getFileSignedUrl(messageData.url);

        sendMessageToUser(conversation.user, messageData);

        throw createHttpError(500, "Message not sent");
      }
    }

    newMessage.url = fileUrl;
    const messageData = await Message.findOne({
      _id: newMessage._id,
    }).populate("author", "name");

    messageData.url = await getFileSignedUrl(messageData.url);

    sendMessageToUser(conversation.user, messageData);

    return res.status(201).json({ message: newMessage });
  } catch (err) {
    next(err);
  }
};

export const updateStarredMessage = async (req, res, next) => {
  try {
    const { id: messageId } = req.params;

    if (!messageId) {
      throw createHttpError(400, "Message ID is required");
    }

    const { starred } = req.body;

    if (starred === undefined) {
      throw createHttpError(400, "Starred status is required");
    }

    const message = await Message.findById(messageId);

    if (!message) {
      throw createHttpError(404, "Message not found");
    }

    const user = req.user;

    if (
      message.author.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      throw createHttpError(
        403,
        "You are not allowed to update the starred status of this message"
      );
    }

    message.isStarred = starred;

    await message.save();

    console.log("Message starred status updated", message);

    return res.status(200).json({ message: "Message starred status updated" });
  } catch (err) {
    next(err);
  }
};

export const forwardMessage = async (req, res, next) => {
  try {
    const { messageId, conversationId } = req.body;

    if (!messageId) {
      throw createHttpError(400, "Message ID is required");
    }

    if (!conversationId) {
      throw createHttpError(400, "Conversation ID is required");
    }

    const user = req.user;

    console.log("Message ID", messageId);

    const message = await Message.findById(messageId);

    if (!message) {
      throw createHttpError(404, "Message not found");
    }

    const newMessage = new Message({
      _id: `message-${nanoid()}`,
      conversation: conversationId,
      author: user._id,
      type: message.type,
      text: message.text,
      name: message.name,
      size: message.size,
      url: message.url,
      mimeType: message.mimeType,
      status: "sent",
    });

    await newMessage.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id,
    });

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw createHttpError(404, "Conversation not found");
    }

    const customer = await Customer.findById(conversation.customer);
    if (!customer) {
      throw createHttpError(404, "Customer not found");
    }

    if (message.type === "text") {
      const response = await sendText(
        customer.phone,
        newMessage._id,
        message.text
      );

      if (!response.success) {
        newMessage.status = "failed";
        await newMessage.save();

        const messageData = await Message.findOne({
          _id: newMessage._id,
        }).populate("author", "name");

        sendMessageToUser(conversation.user, messageData);

        throw createHttpError(500, "Message not sent");
      }
    } else if (message.type === "image") {
      const fileUrl = await getFileSignedUrl(newMessage.url);
      const response = await sendImage(customer.phone, newMessage._id, fileUrl);

      if (!response.success) {
        newMessage.status = "failed";
        await newMessage.save();

        const messageData = await Message.findOne({
          _id: newMessage._id,
        }).populate("author", "name");

        messageData.url = await getFileSignedUrl(messageData.url);

        sendMessageToUser(conversation.user, messageData);

        throw createHttpError(500, "Message not sent");
      }
    } else {
      const fileUrl = await getFileSignedUrl(newMessage.url);
      const response = await sendFile(customer.phone, newMessage._id, fileUrl);
      if (!response.success) {
        newMessage.status = "failed";
        await newMessage.save();

        const messageData = await Message.findOne({
          _id: newMessage._id,
        }).populate("author", "name");

        messageData.url = await getFileSignedUrl(messageData.url);

        sendMessageToUser(conversation.user, messageData);

        throw createHttpError(500, "Message not sent");
      }
    }

    const messageData = await Message.findOne({
      _id: newMessage._id,
    }).populate("author", "name");

    sendMessageToUser(conversation.user, messageData);

    return res.status(201).json({ message: newMessage });
  } catch (err) {
    next(err);
  }
};

export const receiveMessage = async (req, res, next) => {
  try {
    const { error } = sendMessageSchema.validate(req.body);

    if (error) {
      throw createHttpError(400, error.message);
    }

    const { conversationId, type } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw createHttpError(404, "Conversation not found");
    }

    const author = conversation.customer;

    if (!author) {
      throw createHttpError(404, "Customer not found");
    }

    if (type === "text") {
      const { text } = req.body;

      const newMessage = new Message({
        conversation: conversationId,
        author,
        type: "text",
        text,
      });

      await newMessage.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: newMessage._id,
      });

      return res
        .status(201)
        .json({ message: "Message sent by customer successfully" });
    }

    const file = req.file;

    if (!file) {
      throw createHttpError(400, "File is required");
    }

    const uploadedFile = await addFile("messages", file);

    const newMessage = new Message({
      conversation: conversationId,
      author,
      type,
      name: file.originalname,
      size: file.size,
      url: uploadedFile,
      mimeType: file.mimetype,
    });

    await newMessage.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id,
    });

    return res
      .status(201)
      .json({ message: "Message sent by customer successfully" });
  } catch (err) {
    next(err);
  }
};

export const sendTemplate = async (req, res, next) => {
  try {
    const { error } = sendTemplateSchema.validate(req.body);

    if (error) {
      throw createHttpError(400, error.message);
    }

    const { conversationId, templateId } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw createHttpError(404, "Conversation not found");
    }

    const template = await Template.findById(templateId);

    if (!template) {
      throw createHttpError(404, "Template not found");
    }

    const user = req.user;

    // check if the user is allowed to send the template in that conversation or user is admin
    if (
      conversation.user.toString() !== req.user._id.toString() &&
      user.role !== "admin"
    ) {
      throw createHttpError(
        403,
        "You are not allowed to send this template to this conversation"
      );
    }

    const author = user._id;

    if (template.text !== "") {
      const newMessage = new Message({
        _id: `message-${nanoid()}`,
        conversation: conversationId,
        author,
        type: "text",
        text: template.text,
      });

      await newMessage.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: newMessage._id,
      });

      const customer = await Customer.findById(conversation.customer);

      if (!customer) {
        throw createHttpError(404, "Customer not found");
      }
      const text = template.text;

      const response = await sendText(customer.phone, newMessage._id, text);

      if (!response.success) {
        newMessage.status = "failed";
        await newMessage.save();

        const messageData = await Message.findOne({
          _id: newMessage._id,
        }).populate("author", "name");

        sendMessageToUser(conversation.user, messageData);
        throw createHttpError(500, "Message not sent");
      }

      const messageData = await Message.findOne({
        _id: newMessage._id,
      }).populate("author", "name");

      sendMessageToUser(conversation.user, messageData);
    }

    const files = template.files || [];

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];

      const newMessage = new Message({
        _id: `message-${nanoid()}`,
        conversation: conversationId,
        author,
        type: fileData.type,
        name: fileData.name,
        size: fileData.size,
        url: fileData.url,
        mimeType: fileData.mimeType,
      });

      await newMessage.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: newMessage._id,
      });

      const customer = await Customer.findById(conversation.customer);

      if (!customer) {
        throw createHttpError(404, "Customer not found");
      }

      const fileUrl = await getFileSignedUrl(newMessage.url);

      if (type === "image") {
        const response = await sendImage(
          customer.phone,
          newMessage._id,
          fileUrl
        );
        if (!response.success) {
          newMessage.status = "failed";
          await newMessage.save();

          const messageData = await Message.findOne({
            _id: newMessage._id,
          }).populate("author", "name");

          messageData.url = await getFileSignedUrl(messageData.url);

          sendMessageToUser(conversation.user, messageData);

          throw createHttpError(500, "Message not sent");
        }
      } else {
        const response = await sendFile(
          customer.phone,
          newMessage._id,
          fileUrl
        );
        if (!response.success) {
          newMessage.status = "failed";
          await newMessage.save();

          const messageData = await Message.findOne({
            _id: newMessage._id,
          }).populate("author", "name");

          messageData.url = await getFileSignedUrl(messageData.url);

          sendMessageToUser(conversation.user, messageData);

          throw createHttpError(500, "Message not sent");
        }
      }

      const messageData = await Message.findOne({
        _id: newMessage._id,
      }).populate("author", "name");

      messageData.url = await getFileSignedUrl(messageData.url);

      sendMessageToUser(conversation.user, messageData);
    }

    return res.status(201).json({ message: "Template sent successfully" });
  } catch (err) {
    next(err);
  }
};

export const searchMessage = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      throw createHttpError(400, "Query is required");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { text: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    })
      .limit(limit)
      .skip(skip);

    if (!messages) {
      throw createHttpError(404, "No messages found");
    }

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      if (message.type !== "text") {
        message.url = await getFileSignedUrl(message.url);
      }
    }

    return res.status(200).json({ messages });
  } catch (err) {
    next(err);
  }
};

export const handleWebhook = async (req, res, next) => {
  try {
    console.log("Received webhook", req.body);
    const { event } = req.body;

    if (event === "message") {
      const { token, uid, contact, message } = req.body;

      const { uid: contactUid, name: contactName, type: contactType } = contact;
      const {
        dtm: messageDtm,
        uid: messageUid,
        cuid: messageCuid,
        dir: messageDir,
        type: messageType,
        body,
        ack,
      } = message;
      const {
        text: messageText,
        caption: messageCaption,
        url: messageUrl,
        mimetype: messageMimeType,
        size: messageSize,
      } = body;

      let status;
      switch (Number(ack)) {
        case 0:
          status = "pending";
          break;
        case 1:
          status = "sent";
          break;
        case 2:
          status = "delivered";
          break;
        case 3:
          status = "read";
          break;
        default:
          status = "failed";
      }

      const msgType = messageType === "chat" ? "text" : messageType;

      if (!["text", "image", "video", "file"].includes(msgType)) {
        throw createHttpError(400, "Invalid message type");
      }

      let customer = await Customer.findOne({ phone: contactUid });

      let conversation = await Conversation.findOne({
        customer: customer?._id,
      });

      let config = await Config.findOne({});

      if (!config) {
        throw createHttpError(404, "Default user not found");
      }

      if (!customer) {
        // Create a new customer
        customer = new Customer({
          _id: `customer-${nanoid()}`,
          name: contactName,
          phone: contactUid,
          company: "Not Available",
          assigned_user: config.defaultUser,
        });
        await customer.save();

        // Create a new conversation with the new customer
        conversation = new Conversation({
          user: config.defaultUser,
          customer: customer._id,
          unreadCount: 0,
          lastMessage: null,
        });
        await conversation.save();
      }

      // Create a new message using the incoming data
      let newMessage;
      if (messageDir === "o") {
        if (messageCuid && !messageCuid.startsWith("message")) {
          if (msgType === "text") {
            newMessage = new Message({
              _id: `message-` + nanoid(),
              conversation: conversation._id,
              type: msgType,
              text: messageText,
              author: config.admin,
              status,
            });
          } else {
            const url = messageUrl;
            const baseDir = process.cwd();
            const tempDir = path.join(baseDir, "public", "temp");

            if (!fs.existsSync(tempDir)) {
              fs.mkdirSync(tempDir, { recursive: true });
            }

            const fileName = `${messageType}-${url.split("/").pop()}`;
            const filePath = path.join(tempDir, fileName);

            try {
              const response = await fetch(url, {
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
                },
              });
              if (!response.ok) {
                console.error(
                  "Error fetching file:",
                  response.status,
                  response.statusText
                );
                return res
                  .status(response.status)
                  .json({ error: response.statusText });
              }
              const buffer = await response.buffer();
              await fs.promises.writeFile(filePath, buffer);
              console.log("File saved:", filePath);
            } catch (fetchError) {
              console.error("Error fetching file:", fetchError);
              return res.status(500).json({ error: "Error fetching file" });
            }

            const file = {
              filename: fileName,
              path: filePath,
              mimetype: messageMimeType,
              size: messageSize,
            };

            let uploadedFile;
            try {
              uploadedFile = await addFile("messages", file);
              console.log("File uploaded", uploadedFile);
            } catch (uploadError) {
              console.error("Error uploading file:", uploadError);
              return res.status(500).json({ error: "Error uploading file" });
            }

            newMessage = new Message({
              _id: `message-${nanoid()}`,
              conversation: conversation._id,
              type: msgType,
              name: fileName,
              size: messageSize,
              url: uploadedFile,
              mimeType: messageMimeType,
              author: config.admin,
              status,
            });
          }
        }
      } else if (messageDir === "i") {
        if (msgType === "text") {
          newMessage = new Message({
            _id: `message-` + nanoid(),
            conversation: conversation._id,
            type: msgType,
            text: messageText,
            author: customer._id,
            status,
          });
        } else {
          const url = messageUrl;
          const baseDir = process.cwd();
          const tempDir = path.join(baseDir, "public", "temp");

          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }

          const fileName = `${messageType}-${url.split("/").pop()}`;
          const filePath = path.join(tempDir, fileName);

          try {
            const response = await fetch(url, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
              },
            });
            if (!response.ok) {
              console.error(
                "Error fetching file:",
                response.status,
                response.statusText
              );
              return res
                .status(response.status)
                .json({ error: response.statusText });
            }
            const buffer = await response.buffer();
            await fs.promises.writeFile(filePath, buffer);
            console.log("File saved:", filePath);
          } catch (fetchError) {
            console.error("Error fetching file:", fetchError);
            return res.status(500).json({ error: "Error fetching file" });
          }

          const file = {
            filename: fileName,
            path: filePath,
            mimetype: messageMimeType,
            size: messageSize,
          };

          let uploadedFile;
          try {
            uploadedFile = await addFile("messages", file);
            console.log("File uploaded", uploadedFile);
          } catch (uploadError) {
            console.error("Error uploading file:", uploadError);
            return res.status(500).json({ error: "Error uploading file" });
          }

          newMessage = new Message({
            _id: `message-${nanoid()}`,
            conversation: conversation._id,
            type: msgType,
            name: fileName,
            size: messageSize,
            url: uploadedFile,
            mimeType: messageMimeType,
            author: customer._id,
            status,
          });
        }
      }

      await newMessage.save();

      conversation.lastMessage = newMessage._id;
      await conversation.save();

      const messageData = await Message.findOne({
        _id: newMessage._id,
      }).populate("author", "name");

      sendMessageToUser(conversation.user, messageData);

      return res
        .status(200)
        .json({ success: true, message: "Webhook received" });
    } else if (event === "ack") {
      const { cuid, ack: ackValue } = req.body;

      const message = await Message.findOne({ _id: cuid });

      if (!message) {
        throw createHttpError(404, "Message not found");
      }

      let status;
      switch (Number(ackValue)) {
        case 0:
          status = "pending";
          break;
        case 1:
          status = "sent";
          break;
        case 2:
          status = "delivered";
          break;
        case 3:
          status = "read";
          break;
        default:
          status = "failed";
      }

      message.status = status;
      await message.save();

      return res
        .status(200)
        .json({ success: true, message: "ACK received and status updated" });
    } else {
      throw createHttpError(400, "Invalid event type");
    }
  } catch (error) {
    console.log("Error in webhook", error);
    next(error);
  }
};

let clients = [];

export const handleSSE = async (req, res, next) => {
  try {
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    res.flushHeaders();

    const user = req.user;

    const clientId = user._id;
    const newClient = { id: clientId, res };
    clients.push(newClient);
    console.log(`${clientId} Connected`);

    req.on("close", () => {
      console.log(`${clientId} Connection closed`);
      clients = clients.filter((c) => c.id !== clientId);
    });
  } catch (error) {
    console.error("Error in SSE:", error);
    res.status(500).end();
  }
};

const sendMessageToUser = (userId, message) => {
  for (let client of clients) {
    if (client.id.startsWith("admin") || client.id === userId) {
      client.res.write(`data: ${JSON.stringify(message)}\n\n`);
    }
  }
};
