import winston from "winston";
import { format } from "winston";

const { combine, timestamp, label, printf } = format;

const customFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: "info",
  format: combine(
    label({ label: "server" }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    customFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/info.log", level: "info" }),
    new winston.transports.File({ filename: "logs/warn.log", level: "warn" }),
    new winston.transports.File({ filename: "logs/debug.log", level: "debug" }),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

export const logError = (error) => {
  logger.error(error.message, { stack: error.stack });
};

export const logInfo = (message) => {
  logger.info(message);
};

export const logWarning = (message) => {
  logger.warn(message);
};

export const logDebug = (message) => {
  logger.debug(message);
};
