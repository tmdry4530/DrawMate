import { NextResponse } from "next/server";
import type { ApiSuccess, ApiErrorResponse, ApiErrorCode } from "@/types/api";
import { generateRequestId } from "./request-id";

export function success<T>(data: T, meta?: Record<string, unknown>, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    { data, meta, requestId: generateRequestId() },
    { status }
  );
}

export function error(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: Record<string, unknown>,
  fieldErrors?: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: { code, message, ...(details && { details }), ...(fieldErrors && { fieldErrors }) },
      requestId: generateRequestId(),
    },
    { status }
  );
}

export function notFound(message = "Not found"): NextResponse<ApiErrorResponse> {
  return error("NOT_FOUND", message, 404);
}

export function unauthorized(message = "Authentication required"): NextResponse<ApiErrorResponse> {
  return error("AUTH_REQUIRED", message, 401);
}

export function forbidden(message = "Access denied"): NextResponse<ApiErrorResponse> {
  return error("FORBIDDEN", message, 403);
}

export function validationError(
  message = "Validation failed",
  fieldErrors?: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  return error("VALIDATION_ERROR", message, 422, undefined, fieldErrors);
}
