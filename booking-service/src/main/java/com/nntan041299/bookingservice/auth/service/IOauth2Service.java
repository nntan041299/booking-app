package com.nntan041299.bookingservice.auth.service;

import com.nntan041299.bookingservice.auth.dto.TokenResponse;

public interface IOauth2Service {

    String buildAuthUrl();

    TokenResponse getAccessToken(String code, String state);
}