import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message.replace(/\n/g, '');
    switch (exception.code) {
      case 'P2025': {
        const status = HttpStatus.NOT_FOUND;
        const cleanedMessage = message.replace(/`[^`]+`/g, '');
        response.status(status);
        response.send({
          statusCode: status,
          message: cleanedMessage,
        });
        Logger.error(cleanedMessage);
        break;
      }
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        response.status(status);
        response.send({
          statusCode: status,
          message: `Unique constraint failed on the fields: ${exception?.meta?.target}`,
        });
        break;
      }
      default:
        // default 500 error code
        super.catch(exception, host);
        break;
    }
  }
}