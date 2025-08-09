export default class BaseError extends Error {
  name: string;
  description: string;
  statusCode: number;
  isOperational: boolean;
  errorCode: number;

  constructor({
    name,
    statusCode,
    isOperational,
    description,
    errorCode,
  }: {
    name: string;
    statusCode: number;
    isOperational: boolean;
    description: string | string[];
    errorCode: number;
  }) {
    super(
      typeof description === 'string'
        ? description
        : JSON.stringify(description),
    );
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = name;
    this.description =
      typeof description === 'string'
        ? description
        : JSON.stringify(description);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;

    Error.captureStackTrace(this);
  }
}
