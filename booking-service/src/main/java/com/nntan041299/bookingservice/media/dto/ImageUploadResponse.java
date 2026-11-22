package com.nntan041299.bookingservice.media.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ImageUploadResponse {

    /** Address to show the image from; save this on the employee, service or resource. */
    private String url;

    /** The host's id for the image; keep it to delete the image later. */
    private String publicId;
}
