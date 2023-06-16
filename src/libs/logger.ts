import { createLogger, transports, format } from "winston";
import winston from 'winston'
import 'winston-daily-rotate-file'
import { LOG_PATH } from "./constants";

export const logger = createLogger({
    level: "debug",
    format: winston.format.json(),
    transports: [new winston.transports.DailyRotateFile({
        format: winston.format.combine(
            winston.format.uncolorize(),
            winston.format.label({ label: 'API' }),
            winston.format.timestamp(),
            winston.format.printf(({ level, message, label, timestamp }) => {
                return `${timestamp} [${label}] ${level}: ${message}`
            })
        ),
        filename: LOG_PATH + 'multicall-%DATE%.log',
        level: 'debug',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
    }),],
});
