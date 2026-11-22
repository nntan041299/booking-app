package com.nntan041299.bookingservice.common.exception;

import lombok.Getter;

/** The image host failed or is not configured. Carries {@code ErrorCode.IMAGE_UPLOAD_FAILED} as its message. */
@Getter
public class ImageStorageException extends RuntimeException {

    public ImageStorageException(String message, Throwable cause) {
        super(ErrorCode.IMAGE_UPLOAD_FAILED.name(), cause);
        this.detail = message;
    }

    /**
     * -- GETTER --
     * What went wrong, for logs only; never sent to the client.
     */
    private final String detail;

}
