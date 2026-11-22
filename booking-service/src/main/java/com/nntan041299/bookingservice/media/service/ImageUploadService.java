package com.nntan041299.bookingservice.media.service;

import com.nntan041299.bookingservice.common.exception.ErrorCode;
import com.nntan041299.bookingservice.common.util.ImageUtils;
import com.nntan041299.bookingservice.media.dto.ImageFolder;
import com.nntan041299.bookingservice.media.storage.ImageStorageService;
import com.nntan041299.bookingservice.media.storage.StoredImage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;

/**
 * Checks an uploaded file really is an image we accept, then hands it to the configured
 * {@link ImageStorageService}. Validation lives here, not in the storage providers, so it
 * stays the same whichever provider is used.
 */
@Service
public class ImageUploadService {

    public static final long MAX_BYTES = 5L * 1024 * 1024;

    private final ImageStorageService imageStorageService;
    private final String folderPrefix;

    public ImageUploadService(
            ImageStorageService imageStorageService,
            @Value("${app.storage.folder-prefix:spa}") String folderPrefix) {
        this.imageStorageService = imageStorageService;
        this.folderPrefix = folderPrefix;
    }

    /** Validates (PNG, JPG or WebP, up to 5 MB) and stores the image under {@code <prefix>/<folder>}. */
    public StoredImage upload(MultipartFile file, ImageFolder folder) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException(ErrorCode.INVALID_IMAGE.name());
        }

        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        // Trust the file's bytes, not the client-supplied name or content type.
        if (!ImageUtils.isSupportedImage(content)) {
            throw new IllegalArgumentException(ErrorCode.INVALID_IMAGE.name());
        }

        return imageStorageService.upload(content, folderPrefix + "/" + folder.getPath());
    }

    /** Removes a previously stored image, e.g. when it is replaced. */
    public void delete(String publicId) {
        imageStorageService.delete(publicId);
    }
}
