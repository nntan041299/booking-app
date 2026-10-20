package com.nntan041299.bookingservice.common.dto;

import com.nntan041299.bookingservice.common.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public class ErrorResponse {

    private int status;
    private String errorCode;
    private String message;

    public static ErrorResponse of(HttpStatus status, ErrorCode errorCode) {
        return new ErrorResponse(status.value(), errorCode.getCode(), errorCode.getDefaultMessage());
    }
}
