package com.nntan041299.bookingservice.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Business error codes returned to the client in {@code errorCode}.
 * The front end maps each code to a user-facing message, so codes must stay stable.
 *
 * Throw the existing exceptions with {@code ErrorCode.X.name()} as the message, e.g.
 * {@code new IllegalArgumentException(ErrorCode.EMAIL_ALREADY_EXISTS.name())}; the
 * {@link GlobalExceptionHandler} resolves the code from it.
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    INVALID_REQUEST("00001", "Invalid request"),
    INVALID_CREDENTIALS("00002", "Invalid credentials"),
    USER_NOT_FOUND("00003", "User not found"),
    ACCOUNT_DISABLED("00004", "Account is disabled"),
    ACCESS_DENIED("00005", "Access denied"),
    AUTHENTICATION_REQUIRED("00006", "Authentication required"),
    USERNAME_ALREADY_EXISTS("00007", "Username already exists"),
    EMAIL_ALREADY_EXISTS("00008", "Email already exists"),
    CURRENT_PASSWORD_REQUIRED("00009", "Current password is required to set a new password"),
    CURRENT_PASSWORD_INCORRECT("00010", "Current password is incorrect"),
    INVALID_AUTH_HEADER("00011", "Missing or invalid Authorization header"),
    INVALID_TOKEN_TYPE("00012", "Invalid token type"),
    INVALID_REFRESH_TOKEN("00013", "Invalid refresh token"),
    INVALID_OAUTH_STATE("00014", "Invalid or expired OAuth state"),
    INVALID_REQUEST_FORMAT("00015", "Invalid request format"),
    INTERNAL_ERROR("99999", "An unexpected error occurred");

    private final String code;
    private final String defaultMessage;

    /** Returns the code named by {@code key} (an enum name), or {@link #INTERNAL_ERROR} if it is not one. */
    public static ErrorCode resolve(String key) {
        for (ErrorCode value : values()) {
            if (value.name().equals(key)) {
                return value;
            }
        }
        return INTERNAL_ERROR;
    }
}
