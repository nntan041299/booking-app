package com.nntan041299.bookingservice.media.storage;

/**
 * An image that has been stored with a hosting provider.
 *
 * @param url      public address to show the image from; save this on the record
 * @param publicId the provider's id for the image; keep it so the image can be deleted later
 */
public record StoredImage(String url, String publicId) {
}
