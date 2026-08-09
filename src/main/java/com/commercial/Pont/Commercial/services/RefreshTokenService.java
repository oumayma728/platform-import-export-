package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.models.RefreshToken;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.RefreshTokenRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    @Transactional
    public RefreshToken createRefreshToken(
            Utilisateur utilisateur
    ) {

        refreshTokenRepository
                .deleteByUtilisateurUtilisateurId(
                        utilisateur.getUtilisateurId()
                );

        RefreshToken refreshToken =
                RefreshToken.builder()
                        .token(UUID.randomUUID().toString())
                        .utilisateur(utilisateur)
                        .expiryDate(
                                LocalDateTime.now()
                                        .plusNanos(
                                                refreshExpiration * 1_000_000
                                        )
                        )
                        .revoked(false)
                        .createdAt(LocalDateTime.now())
                        .build();

        return refreshTokenRepository.save(
                refreshToken
        );
    }

    public RefreshToken verifyExpiration(
            RefreshToken refreshToken
    ) {

        if (
                refreshToken.isRevoked()
                        ||
                        refreshToken.getExpiryDate()
                                .isBefore(LocalDateTime.now())
        ) {

            refreshTokenRepository.delete(
                    refreshToken
            );

            throw new RuntimeException(
                    "Refresh token expiré ou révoqué"
            );
        }

        return refreshToken;
    }

    public void revokeToken(
            String token
    ) {

        refreshTokenRepository
                .findByToken(token)
                .ifPresent(refreshToken -> {

                    refreshToken.setRevoked(true);

                    refreshTokenRepository.save(
                            refreshToken
                    );
                });
    }


    public RefreshToken findByToken(
            String token
    ) {

        return refreshTokenRepository
                .findByToken(token)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Refresh token introuvable"
                        )
                );
    }

}