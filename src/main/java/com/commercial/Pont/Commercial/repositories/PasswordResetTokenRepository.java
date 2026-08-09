package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.models.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByEmailAndCode(
            String email,
            String code
    );

    void deleteByEmail(String email);
}