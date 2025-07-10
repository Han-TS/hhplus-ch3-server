import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

export const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/app.log', // 로그 파일 경로
      level: 'info',
    }),
    // new winston.transports.Console({ 
    //   format: winston.format.combine(
    //     winston.format.colorize(),
    //     nestWinstonModuleUtilities.format.nestLike()
    //   ),
    // }),
  ],
});
