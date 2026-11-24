package com.nntan041299.bookingservice.auth.service;

import com.nntan041299.bookingservice.auth.entity.User;
import com.nntan041299.bookingservice.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

/**
 * Resolves the {@link User} entity for the currently authenticated principal.
 * Centralized here so services don't duplicate the SecurityContextHolder + lookup logic.
 */
@Component
@RequiredArgsConstructor
public class CurrentUserProvider {

    private final UserRepository userRepository;

    /** The authenticated principal's username, without touching the database. */
    public String getCurrentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    public User getCurrentUser() {
        String username = getCurrentUsername();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }
}
