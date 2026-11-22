package com.nntan041299.bookingservice.media.dto;

import lombok.Getter;

/** What an image belongs to. Decides the folder it is stored in. */
@Getter
public enum ImageFolder {
    EMPLOYEES("employees"),
    SERVICES("services"),
    RESOURCES("resources");

    private final String path;

    ImageFolder(String path) {
        this.path = path;
    }

}
