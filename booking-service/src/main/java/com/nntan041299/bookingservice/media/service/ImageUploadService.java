package com.nntan041299.bookingservice.media.service;

import com.nntan041299.bookingservice.common.exception.ErrorCode;
import com.nntan041299.bookingservice.common.exception.ImageStorageException;
import com.nntan041299.bookingservice.common.util.ImageUtils;
import com.nntan041299.bookingservice.media.dto.ImageFolder;
import com.nntan041299.bookingservice.media.storage.ImageStorageService;
import com.nntan041299.bookingservice.media.storage.StoredImage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;

/**
 * Checks an uploaded file really is an image we accept, then hands it to the configured
 * {@link ImageStorageService}. Validation lives here, not in the storage providers, so it
 * stays the same whichever provider is used.
 */
@Slf4j
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

    /**
     * Like {@link #upload}, for use inside a transaction: returns the URL of the stored image, or {@code null}
     * when no file was sent. If the transaction rolls back, the uploaded image is removed again.
     */
    public String uploadInTransaction(MultipartFile file, ImageFolder folder) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        StoredImage stored = upload(file, folder);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) {
                    deleteByUrl(stored.url());
                }
            }
        });
        return stored.url();
    }

    /** Removes the image behind a URL only once the surrounding transaction commits. */
    public void deleteByUrlAfterCommit(String url) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deleteByUrl(url);
            }
        });
    }

    /**
     * Removes the image behind a URL we handed out earlier. Best effort: URLs from elsewhere are ignored and a
     * storage failure is only logged, so replacing an image never fails because the old one could not be cleaned up.
     */
    public void deleteByUrl(String url) {
        imageStorageService.publicIdFromUrl(url).ifPresent(publicId -> {
            try {
                imageStorageService.delete(publicId);
            } catch (ImageStorageException e) {
                log.warn("Could not delete old image {}", publicId, e);
            }
        });
    }

    /** Removes a previously stored image, e.g. when it is replaced. */
    public void delete(String publicId) {
        imageStorageService.delete(publicId);
    }
}
