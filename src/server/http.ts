import { ZodError, type z } from 'zod';

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export async function parseRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}

export function jsonResponse<T>(data: T, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export function createdResponse<T>(data: T): Response {
  return jsonResponse(data, { status: 201 });
}

export function successResponse(): Response {
  return jsonResponse({ success: true });
}

export function notFoundResponse(message: string): Response {
  return jsonResponse({ error: message }, { status: 404 });
}

export function assertFound<T>(
  value: T | null | undefined,
  message: string
): T {
  if (!value) {
    throw new NotFoundError(message);
  }

  return value;
}

export function createErrorResponse(error: unknown): Response {
  if (error instanceof ZodError) {
    return Response.json(
      {
        error: 'Invalid request body',
        details: error.flatten(),
      },
      { status: 400 }
    );
  }

  if (error instanceof HttpError) {
    return Response.json(
      error.details ? { error: error.message, details: error.details } : { error: error.message },
      { status: error.status }
    );
  }

  if (error instanceof Error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ error: 'Unknown server error' }, { status: 500 });
}
