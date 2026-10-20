import type { AxiosError } from "axios";

export const DEFAULT_ERROR_MESSAGE = "Server error, try again later";

// Keep in sync with ErrorCode.java in booking-service.
export const ERROR_MESSAGES: Record<string, string> = {
  "00001": "Invalid request",
  "00002": "Incorrect username or password",
  "00003": "User not found",
  "00004": "Your account is disabled",
  "00005": "You do not have permission to do this",
  "00006": "Please sign in to continue",
  "00007": "Username already exists",
  "00008": "Email already exists",
  "00009": "Current password is required to set a new password",
  "00010": "Current password is incorrect",
  "00011": "Missing or invalid authorization header",
  "00012": "Invalid token type",
  "00013": "Invalid refresh token, please sign in again",
  "00014": "Sign-in session expired, please try again",
  "00015": "Invalid request format",
};

interface ApiErrorBody {
  errorCode?: string;
  // Errors from @RestControllerAdvice are wrapped as { data: { ... } },
  // errors from the security filters are not.
  data?: { errorCode?: string };
}

/**
 * Maps a failed request to a user-facing message. Only responses whose HTTP
 * status is neither 200 nor 500 are mapped from their errorCode; anything
 * else (network errors, 500s, unknown codes) falls back to the generic message.
 */
export function getErrorMessage(error: unknown): string {
  const response = (error as AxiosError<ApiErrorBody> | null)?.response;
  if (!response || response.status === 200 || response.status === 500) {
    return DEFAULT_ERROR_MESSAGE;
  }
  const errorCode = response.data?.data?.errorCode ?? response.data?.errorCode;
  return (errorCode && ERROR_MESSAGES[errorCode]) || DEFAULT_ERROR_MESSAGE;
}
