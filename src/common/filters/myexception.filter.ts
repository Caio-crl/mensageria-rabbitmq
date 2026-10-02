import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { appLogger, getSafeErrorLogFields } from '../logger/app-logger';

@Catch()
@Injectable()
export class MyExceptionFilter implements ExceptionFilter {
  async catch(exception: unknown, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<Request>();
    const response = host.switchToHttp().getResponse<Response>();

    const status =
      typeof (exception as { getStatus?: unknown }).getStatus !== 'function'
        ? 500
        : (exception as { getStatus: () => number }).getStatus();
    const message =
      typeof (exception as { getResponse?: unknown }).getResponse !==
      'function'
        ? getSafeExceptionMessage(exception)
        : (exception as { getResponse: () => unknown }).getResponse();

    if (
      exception instanceof TypeError ||
      (exception instanceof InternalServerErrorException &&
        typeof exception.getResponse === 'undefined')
    ) {
      appLogger.error('Erro interno nao tratado', {
        method: request.method,
        path: getRoutePath(request),
        statusCode: 500,
        ...getSafeErrorLogFields(exception),
      });
      return response.status(500).json({ message: 'Internal server error' });
    }

    if (status >= 500) {
      appLogger.error(getHttpExceptionLogMessage(exception), {
        method: request.method,
        path: getRoutePath(request),
        statusCode: status,
        ...getSafeErrorLogFields(exception),
      });
    } else if (status >= 400) {
      appLogger.warn(getHttpExceptionLogMessage(exception), {
        method: request.method,
        path: getRoutePath(request),
        statusCode: status,
        ...getSafeErrorLogFields(exception),
      });
    }

    return response.status(status).json(message);
  }
}

function getSafeExceptionMessage(exception: unknown): string {
  if (exception instanceof Error) {
    return exception.message;
  }

  return 'Internal server error';
}

function getRoutePath(request: Request): string {
  const routePath = (request.route as { path?: unknown } | undefined)?.path;
  if (typeof routePath === 'string') {
    return routePath;
  }

  return request.path;
}

function getHttpExceptionLogMessage(exception: unknown): string {
  const { errorName } = getSafeErrorLogFields(exception);

  if (errorName && errorName !== 'object') {
    return `Requisicao falhou com ${errorName}`;
  }

  return 'Requisicao falhou';
}
