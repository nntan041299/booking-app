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
    SERVICE_NAME_ALREADY_EXISTS("00016", "Service name already exists"),
    EMPLOYEE_NOT_FOUND("00017", "Employee not found"),
    INVALID_WORKING_HOURS("00018", "Working hours are invalid: start must be before end and ranges on the same day must not overlap"),
    SERVICE_NOT_FOUND("00019", "One or more services do not exist"),
    SERVICE_NOT_AVAILABLE("00020", "Service is not available for booking"),
    EMPLOYEE_NOT_AVAILABLE("00021", "Employee is not available for this service"),
    APPOINTMENT_IN_PAST("00022", "Appointment must start in the future"),
    OUTSIDE_WORKING_HOURS("00023", "Appointment is outside the employee's working hours"),
    TIME_SLOT_UNAVAILABLE("00024", "The selected time slot is already booked"),
    RESOURCE_NAME_ALREADY_EXISTS("00025", "Resource name already exists"),
    RESOURCE_NOT_FOUND("00026", "Resource not found"),
    INVALID_IMAGE("00027", "Upload a PNG, JPG or WebP image up to 5 MB"),
    IMAGE_UPLOAD_FAILED("00028", "The image could not be uploaded, try again later"),
    APPOINTMENT_NOT_FOUND("00029", "Appointment not found"),
    APPOINTMENT_EXPIRED("00030", "This booking was not paid in time, please pick a slot again"),
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
