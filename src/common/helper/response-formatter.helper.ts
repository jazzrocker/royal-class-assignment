export interface ResponseMeta {
  code: number;
  message: string;
}

export interface FormattedResponse<T = any> {
  data: T;
  meta: ResponseMeta;
}

export interface LoginResponse<T = any> extends FormattedResponse<T> {
  token: string;
}

export type ResponseStatus = 
  | 'success' 
  | 'unauthorized' 
  | 'forbidden' 
  | 'not_found' 
  | 'bad_request' 
  | 'internal_error'
  | 'conflict'
  | 'validation_error';

/**
 * Maps response status flags to HTTP status codes
 */
const STATUS_CODE_MAP: Record<ResponseStatus, number> = {
  success: 200,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  bad_request: 400,
  internal_error: 500,
  conflict: 409,
  validation_error: 422,
};

/**
 * Formats API responses with consistent structure
 * 
 * @param data - The response data
 * @param message - The response message
 * @param status - The response status flag (defaults to 'success')
 * @returns Formatted response object
 * 
 * @example
 * // Success response
 * formatResponse(userData, "User fetched successfully", "success")
 * 
 * @example
 * // Error response
 * formatResponse(null, "Authentication required", "unauthorized")
 */
export function formatResponse<T = any>(
  data: T,
  message: string,
  status: ResponseStatus = 'success'
): FormattedResponse<T> {
  const code = STATUS_CODE_MAP[status];
  
  return {
    data,
    meta: {
      code,
      message,
    },
  };
}

/**
 * Formats login responses with token
 * 
 * @param data - The user/login data
 * @param token - The authentication token
 * @param message - The response message
 * @param status - The response status flag (defaults to 'success')
 * @returns Formatted login response object with token
 * 
 * @example
 * // Login success response
 * formatLoginResponse(userData, "jwt-token-here", "Login successful", "success")
 */
export function formatLoginResponse<T = any>(
  data: T,
  token: string,
  message: string,
  status: ResponseStatus = 'success'
): LoginResponse<T> {
  const code = STATUS_CODE_MAP[status];
  
  return {
    data,
    token,
    meta: {
      code,
      message,
    },
  };
}

/**
 * Convenience functions for common response types
 */
export const ResponseFormatter = {
  /**
   * Success response (200)
   */
  success: <T>(data: T, message: string = 'Operation successful') =>
    formatResponse(data, message, 'success'),

  /**
   * Unauthorized response (401)
   */
  unauthorized: <T = null>(data: T | null = null, message: string = 'Unauthorized access') =>
    formatResponse(data, message, 'unauthorized'),

  /**
   * Forbidden response (403)
   */
  forbidden: <T = null>(data: T | null = null, message: string = 'Access forbidden') =>
    formatResponse(data, message, 'forbidden'),

  /**
   * Not found response (404)
   */
  notFound: <T = null>(data: T | null = null, message: string = 'Resource not found') =>
    formatResponse(data, message, 'not_found'),

  /**
   * Bad request response (400)
   */
  badRequest: <T = null>(data: T | null = null, message: string = 'Bad request') =>
    formatResponse(data, message, 'bad_request'),

  /**
   * Internal error response (500)
   */
  internalError: <T = null>(data: T | null = null, message: string = 'Internal server error') =>
    formatResponse(data, message, 'internal_error'),

  /**
   * Conflict response (409)
   */
  conflict: <T = null>(data: T | null = null, message: string = 'Resource conflict') =>
    formatResponse(data, message, 'conflict'),

  /**
   * Validation error response (422)
   */
  validationError: <T = null>(data: T | null = null, message: string = 'Validation failed') =>
    formatResponse(data, message, 'validation_error'),

  /**
   * Login success response with token (200)
   */
  loginSuccess: <T>(data: T, token: string, message: string = 'Login successful') =>
    formatLoginResponse(data, token, message, 'success'),
};
