package com.nntan041299.bookingservice.media.storage;

/**
 * Where uploaded images are kept. The rest of the application only depends on this
 * interface, so the hosting provider can be replaced by writing another implementation
 * and switching {@code app.storage.provider}; nothing else needs to change.
 *
 * <p>Implementations only talk to the provider. Checking that the bytes are a valid image,
 * and which folder to use, is done before this is called (see {@code ImageUploadService}).
 *
 * <p>Failures are reported with {@link com.nntan041299.bookingservice.common.exception.ImageStorageException}.
 */
public interface ImageStorageService {

    /**
     * Stores an image.
     *
     * @param content the image file's bytes
     * @param folder  provider-side folder to keep it in, e.g. {@code spa/resources}
     */
    StoredImage upload(byte[] content, String folder);

    /** Deletes a stored image by its {@link StoredImage#publicId()}. Deleting a missing image is not an error. */
    void delete(String publicId);
}
