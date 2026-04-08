import { ZodError, type z } from 'zod';

export async function parseRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
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

  if (error instanceof Error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ error: 'Unknown server error' }, { status: 500 });
}
