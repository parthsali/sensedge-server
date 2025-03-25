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
import { sendText } from "../../services/waboxappService.js";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

export const sendMessage = async (req, res, next) => {
  try {
    const { error } = sendMessageSchema.validate(req.body);

    if (error) {
      throw createHttpError(400, error.message);
    }

    const { conversationId, type } = req.body;

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

      const newMessage = new Message({
        conversation: conversationId,
        author,
        type: "text",
        text,
      });

      await newMessage.save();

      const customer = await Customer.findById(conversation.customer);

      console.log("Sending message to", customer.phone, text);

      // call sendText function if fails then delete the message
      const response = await sendText(customer.phone, newMessage._id, text);
      if (!response.success) {
        await Message.findByIdAndDelete(newMessage._id);
        throw createHttpError(500, "Message not sent");        
      }

      console.log("Message sent", response);

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: newMessage._id,
      });

      return res.status(201).json({ message: newMessage });
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
      isAWSUrl: true,
      mimeType: file.mimetype,
    });

    await newMessage.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id,
    });

    newMessage.url = await getFileSignedUrl(newMessage.url);

    return res.status(201).json({ message: newMessage });
  } catch (err) {
    next(err);
  }
};

export const updateMessageStatus = async (req, res, next) => {
  try {
    const { messageId } = req.params;

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
        "You are not allowed to update the status of this message"
      );
    }

    const { status } = req.body;

    if (status !== "read") {
      throw createHttpError(400, "Invalid status");
    }

    message.status = status;

    await message.save();

    return res
      .status(200)
      .json({ message: "Message status updated", updatedMessage: message });
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
        conversation: conversationId,
        author,
        type: "text",
        text: template.text,
      });

      await newMessage.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: newMessage._id,
      });
    }

    const files = template.files || [];

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];

      const newMessage = new Message({
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

    const messages = await Message.find({
      $or: [
        { text: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    });

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
    const {
      event,
    } = req.body;

    if (event === "message") {
      const {
        token,
      uid,
      contact,
      message,
    } = req.body;

    const {uid : contactUid, name: contactName, type: contactType} = contact;
    const {dtm: messageDtm, uid: messageUid, cuid: messageCuid, dir: messageDir, type: messageType, body,  ack} = message;
    const {text: messageText, caption : messageCaption, url: messageUrl, mimetype: messageMimeType, size : messageSize} = body;

    // console all the fields
   
    if(messageDir !== "i") {
      return res.status(200).json({ success: true, message : "Outgoing message from the user"});
    }
    

    // return res.status(200).json({ success: true, message: "Webhook received" });

      
      // Map ACK status to message status

      let status;
      switch (Number(ack)) {
        case 0:
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

      // Map message type; if it's 'chat', treat it as text
      const msgType = messageType === "chat" ? "text" : messageType;

      // Supported message types: text, image, video, file
      if (!["text", "image", "video", "file"].includes(msgType)) {
        throw createHttpError(400, "Invalid message type");
      }





      let customer = await Customer.findOne({ phone: contactUid });
      
      let conversation = await Conversation.findOne({ customer: customer?._id });

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

      console.log("Webhook : Customer created", customer);

      console.log("Webhook : Conversation created", conversation);

      // Create a new message using the incoming data
      let newMessage;
      if(msgType === "text") {
        newMessage = new Message({
          conversation: conversation._id,
          type : msgType,
          text : messageText,
          author : customer._id,
          status,
        });
      } else {
        newMessage = new Message({
          conversation: conversation._id,
          type : msgType,
          name : messageType + "-" + messageUid,
          size : messageSize,
          url : messageUrl,
          mimeType : messageMimeType,
          author : customer._id,
          status,
        });
      }

      await newMessage.save();

      console.log("Webhook : New Message saved", newMessage);

      // Update conversation's lastMessage field
      conversation.lastMessage = newMessage._id;
      await conversation.save();

      console.log("Webhook : Conversation updated", conversation);

      console.log("Message saved", newMessage);

      return res.status(200).json({ success: true, message: "Webhook received" });
    } 
    
    else if (event === "ack") {
      console.log("Received ACK event", req.body);
      // Extract fields for the ACK event
      const { cuid, ack: ackValue } = req.body;

      // Find the message by custom unique ID (cuid)
      const message = await Message.findOne({ _id : cuid });
      if (!message) {
        throw createHttpError(404, "Message not found");
      }

      // Map ACK value to status
      let status;
      switch (Number(ackValue)) {
        case 0:
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

      // Update the message status
      message.status = status;
      await message.save();

      console.log("Message status updated", message);

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
