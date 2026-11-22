package com.nntan041299.bookingservice.media.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.nntan041299.bookingservice.common.exception.ImageStorageException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** {@link ImageStorageService} backed by Cloudinary. Active when {@code app.storage.provider=cloudinary}. */
@Slf4j
@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "cloudinary", matchIfMissing = true)
public class CloudinaryImageStorageService implements ImageStorageService {

    /** {@code https://res.cloudinary.com/<cloud>/image/upload/[v123/]<public id>[.ext]} */
    private static final Pattern DELIVERY_URL =
            Pattern.compile("^https?://res\\.cloudinary\\.com/([^/]+)/image/upload/(?:v\\d+/)?(.+?)(?:\\.[A-Za-z0-9]+)?$");

    private final Cloudinary cloudinary;
    private final String cloudName;

    public CloudinaryImageStorageService(
            @Value("${app.storage.cloudinary.cloud-name:}") String cloudName,
            @Value("${app.storage.cloudinary.api-key:}") String apiKey,
            @Value("${app.storage.cloudinary.api-secret:}") String apiSecret) {
        this.cloudName = cloudName;
        if (StringUtils.hasText(cloudName) && StringUtils.hasText(apiKey) && StringUtils.hasText(apiSecret)) {
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true));
        } else {
            // Let the app start without credentials (local dev, tests); uploads fail with a clear log line.
            log.warn("Cloudinary is not configured: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and "
                    + "CLOUDINARY_API_SECRET to enable image uploads");
            this.cloudinary = null;
        }
    }

    @Override
    public StoredImage upload(byte[] content, String folder) {
        Cloudinary client = requireClient();
        try {
            Map<?, ?> result = client.uploader().upload(content, ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "image",
                    "use_filename", false,
                    "unique_filename", true,
                    "overwrite", false));
            return new StoredImage((String) result.get("secure_url"), (String) result.get("public_id"));
        } catch (IOException | RuntimeException e) {
            throw new ImageStorageException("Cloudinary upload failed", e);
        }
    }

    @Override
    public void delete(String publicId) {
        Cloudinary client = requireClient();
        try {
            // "not found" is a normal result for an image that is already gone, so the result is not inspected.
            client.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "image", "invalidate", true));
        } catch (IOException | RuntimeException e) {
            throw new ImageStorageException("Cloudinary delete failed for " + publicId, e);
        }
    }

    @Override
    public Optional<String> publicIdFromUrl(String url) {
        if (!StringUtils.hasText(url)) {
            return Optional.empty();
        }
        Matcher m = DELIVERY_URL.matcher(url.trim());
        // Only our own cloud: never delete something a URL merely looks like.
        if (!m.matches() || !m.group(1).equals(cloudName)) {
            return Optional.empty();
        }
        return Optional.of(m.group(2));
    }

    private Cloudinary requireClient() {
        if (cloudinary == null) {
            throw new ImageStorageException("Cloudinary is not configured", null);
        }
        return cloudinary;
    }
}
