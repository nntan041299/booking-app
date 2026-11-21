package com.nntan041299.bookingservice.common.exception;

/** Thrown when a request is valid but conflicts with current state; the message is an {@link ErrorCode} name. */
public class ConflictException extends RuntimeException {

    public ConflictException(ErrorCode errorCode) {
        super(errorCode.name());
    }
}
