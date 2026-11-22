package com.nntan041299.bookingservice.common.util;

/** Helpers for inspecting image bytes. */
public final class ImageUtils {

    private ImageUtils() {
    }

    /** True when the bytes start with a PNG, JPEG or WebP signature (the file's content, not its name). */
    public static boolean isSupportedImage(byte[] h) {
        if (h == null) {
            return false;
        }
        boolean png = h.length >= 8 && (h[0] & 0xFF) == 0x89 && h[1] == 'P' && h[2] == 'N' && h[3] == 'G';
        boolean jpeg = h.length >= 3 && (h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8 && (h[2] & 0xFF) == 0xFF;
        boolean webp = h.length >= 12 && h[0] == 'R' && h[1] == 'I' && h[2] == 'F' && h[3] == 'F'
                && h[8] == 'W' && h[9] == 'E' && h[10] == 'B' && h[11] == 'P';
        return png || jpeg || webp;
    }
}
