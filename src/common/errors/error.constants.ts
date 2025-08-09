import { RESPONSE_CONSTANTS } from "src/common/constants/response.constants";

export const STATUS_CODES = {
    200: 'OK',
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    408: 'REQUEST_TIMEOUT',
    500: 'INTERNAL_SERVER_ERROR',
    503: 'SERVICE_UNAVAILABLE',
    502: 'BAD_GATEWAY',
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    REQUEST_TIMEOUT: 408,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
    BAD_GATEWAY: 502,
  };
  
  export const errorTypes = {
    RequestInputValidationErrorType: {
      name: 'RequestInputValidationError',
      statusCode: STATUS_CODES.BAD_REQUEST,
      isOperational: true,
      description: RESPONSE_CONSTANTS.PLEASE_CHECK_REQUEST_DATA,
      errorCode: 3001,
    },
    SocketRequestInputValidationErrorType: {
      name: 'SocketRequestInputValidationError',
      statusCode: STATUS_CODES.BAD_REQUEST,
      isOperational: true,
      description: RESPONSE_CONSTANTS.PLEASE_CHECK_REQUEST_DATA,
      errorCode: 3002,
    },
    InternalServerErrorType: {
      name: 'InternalServerError',
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      isOperational: true,
      description: RESPONSE_CONSTANTS.INTERNAL_SERVER_ERROR,
      errorCode: 3003,
    },
    InvalidSocketArgumentErrorType: {
      name: 'InvalidSocketArgumentError',
      statusCode: STATUS_CODES.BAD_REQUEST,
      isOperational: true,
      description: RESPONSE_CONSTANTS.SOCKET_PROVIDE_PROPER_ARGUMENTS,
      errorCode: 3004,
    },
    AuthenticationErrorType: {
      name: 'AuthenticationErrorType',
      statusCode: STATUS_CODES.UNAUTHORIZED,
      isOperational: true,
      description: RESPONSE_CONSTANTS.ACCESS_TOKEN_EXPIRED_OR_NOT_PASSED,
      errorCode: 3005,
    },
    ServiceErrorType: {
      name: 'ServiceErrorType',
      statusCode: STATUS_CODES.BAD_REQUEST,
      isOperational: true,
      description: '',
      errorCode: 3006,
    },
  };
  