package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.requestDtos.*;
import com.commercial.Pont.Commercial.dtos.responseDtos.AuthResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.UtilisateurResponseDto;
import com.commercial.Pont.Commercial.enums.AuthProvider;
import com.commercial.Pont.Commercial.enums.ValidationStatus;
import com.commercial.Pont.Commercial.models.PasswordResetToken;
import com.commercial.Pont.Commercial.models.RefreshToken;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.PasswordResetTokenRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.security.CustomUserDetails;
import com.commercial.Pont.Commercial.security.CustomUserDetailsService;
import com.commercial.Pont.Commercial.security.JwtService;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.UtilisateurServiceInterface;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;

    private final UtilisateurRepository utilisateurRepository;

    private final UtilisateurServiceInterface utilisateurService;

    private final JwtService jwtService;

    private final PasswordEncoder passwordEncoder;

    private final RefreshTokenService refreshTokenService;

    private final CustomUserDetailsService customUserDetailsService;

    private final PasswordResetTokenRepository passwordResetTokenRepository;

    private final EmailService emailService;

    public AuthResponseDto login(
            LoginRequestDto request
    ) {

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                request.getEmail(),
                                request.getPassword()
                        )
                );

        CustomUserDetails userDetails =
                (CustomUserDetails)
                        authentication.getPrincipal();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(
                                request.getEmail()
                        )
                        .orElseThrow();


        ValidationStatus status =
                utilisateur.getValidationStatus();

        if (status == ValidationStatus.EN_ATTENTE_VALIDATION) {
            throw new IllegalStateException(
                    "Votre compte est en attente de validation."
            );
        }

        if (status == ValidationStatus.REJETE) {
            throw new IllegalStateException(
                    "Votre compte a été rejeté."
            );
        }

        if (status == ValidationStatus.SUSPENDU) {
            throw new IllegalStateException(
                    "Votre compte est suspendu."
            );
        }

        String accessToken =
                jwtService.generateAccessToken(
                        userDetails
                );

        RefreshToken refreshToken =
                refreshTokenService
                        .createRefreshToken(
                                utilisateur
                        );

        return AuthResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(
                        refreshToken.getToken()
                )
                .tokenType("Bearer")
                .expiresIn(900L)
                .email(
                        utilisateur.getEmail()
                )
                .roles(
                        userDetails
                                .getAuthorities()
                                .stream()
                                .map(
                                        auth ->
                                                auth.getAuthority()
                                )
                                .toList()
                )
                .build();
    }




    public AuthResponseDto refreshToken(
            RefreshTokenRequestDto request
    ) {

        RefreshToken refreshToken =
                refreshTokenService
                        .findByToken(
                                request.getRefreshToken()
                        );

        refreshTokenService
                .verifyExpiration(
                        refreshToken
                );

        Utilisateur utilisateur =
                refreshToken.getUtilisateur();

        CustomUserDetails userDetails =
                new CustomUserDetails(
                        utilisateur
                );

        String accessToken =
                jwtService.generateAccessToken(
                        userDetails
                );

        return AuthResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(
                        refreshToken.getToken()
                )
                .tokenType("Bearer")
                .expiresIn(900L)
                .email(
                        utilisateur.getEmail()
                )
                .roles(
                        userDetails
                                .getAuthorities()
                                .stream()
                                .map(
                                        auth ->
                                                auth.getAuthority()
                                )
                                .toList()
                )
                .build();
    }




    public void register(UtilisateurRequestDto request , MultipartFile photo) {
        utilisateurService.create(request,photo);
    }


    public UtilisateurResponseDto getProfile(
            Authentication authentication
    ) {

        String email = authentication.getName();

        return utilisateurService.getByEmail(email);
    }



    public UtilisateurResponseDto updateProfile(
            Authentication authentication,
            UpdateProfileRequestDto request
    ) {

        String currentEmail = authentication.getName();

        return utilisateurService.updateProfile(
                currentEmail,
                request
        );
    }








    @Transactional
    public AuthResponseDto loginWithGoogle(
            String googleId,
            String email,
            String nom,
            String prenom,
            String photoProfile
    ) {

        // =====================================================
        // 1. Chercher par Google ID
        // =====================================================

        Optional<Utilisateur> utilisateurOptional =
                utilisateurRepository.findByGoogleId(googleId);

        Utilisateur utilisateur;


        // =====================================================
        // 2. Utilisateur trouvé par Google ID
        // =====================================================

        if (utilisateurOptional.isPresent()) {

            utilisateur = utilisateurOptional.get();

        }

        // =====================================================
        // 3. Google ID inconnu
        // =====================================================

        else {

            // -------------------------------------------------
            // Chercher par email
            // -------------------------------------------------

            Optional<Utilisateur> utilisateurParEmail =
                    utilisateurRepository.findByEmail(email);


            // =================================================
            // 3.1 Email également inconnu
            // =================================================

            if (utilisateurParEmail.isEmpty()) {

                throw new IllegalStateException(
                        "Aucun utilisateur n'est inscrit avec ce compte Google. " +
                                "Veuillez demander à l'administrateur de vous enregistrer."
                );
            }


            // =================================================
            // 3.2 Utilisateur trouvé par email
            // =================================================

            utilisateur =
                    utilisateurParEmail.get();


            // -------------------------------------------------
            // Associer le compte Google au compte existant
            // -------------------------------------------------

            utilisateur.setGoogleId(googleId);

            utilisateur.setAuthProvider(
                    AuthProvider.GOOGLE
            );

            utilisateur.setUpdatedAt(
                    LocalDateTime.now()
            );


            utilisateur =
                    utilisateurRepository.save(
                            utilisateur
                    );
        }


        // =====================================================
        // 4. Vérifier le statut du compte
        // =====================================================

        ValidationStatus status =
                utilisateur.getValidationStatus();


        // =====================================================
        // EN ATTENTE
        // =====================================================

        if (status == ValidationStatus.EN_ATTENTE_VALIDATION) {

            throw new IllegalStateException(
                    "Votre compte est en attente de validation."
            );
        }


        // =====================================================
        // REJETE
        // =====================================================

        if (status == ValidationStatus.REJETE) {

            throw new IllegalStateException(
                    "Votre compte a été rejeté."
            );
        }


        // =====================================================
        // SUSPENDU
        // =====================================================

        if (status == ValidationStatus.SUSPENDU) {

            throw new IllegalStateException(
                    "Votre compte est suspendu."
            );
        }


        // =====================================================
        // 5. Compte VALIDE
        // =====================================================

        UserDetails userDetails =
                customUserDetailsService.loadUserByUsername(
                        utilisateur.getEmail()
                );


        // =====================================================
        // 6. Générer Access Token
        // =====================================================

        String accessToken =
                jwtService.generateAccessToken(
                        userDetails
                );


        // =====================================================
        // 7. Générer Refresh Token
        // =====================================================

        RefreshToken refreshToken =
                refreshTokenService.createRefreshToken(
                        utilisateur
                );


        // =====================================================
        // 8. Récupérer les rôles
        // =====================================================

        List<String> roles =
                userDetails
                        .getAuthorities()
                        .stream()
                        .map(GrantedAuthority::getAuthority)
                        .toList();


        // =====================================================
        // 9. Retourner AuthResponseDto
        // =====================================================

        return AuthResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(
                        refreshToken.getToken()
                )
                .tokenType("Bearer")
                .expiresIn(900L)
                .email(
                        utilisateur.getEmail()
                )
                .roles(roles)
                .build();
    }







    @Transactional
    public void forgotPassword(
            ForgotPasswordRequestDto request
    ) {

        Optional<Utilisateur> utilisateurOptional =
                utilisateurRepository.findByEmail(
                        request.getEmail()
                );

        if (utilisateurOptional.isEmpty()) {

            throw new IllegalStateException(
                    "Aucun utilisateur trouvé avec cet email."
            );
        }

        Utilisateur utilisateur =
                utilisateurOptional.get();

        // Supprimer les anciens codes
        passwordResetTokenRepository
                .deleteByEmail(
                        utilisateur.getEmail()
                );

        // Générer un code à 6 chiffres
        String code =
                String.format(
                        "%06d",
                        new java.util.Random()
                                .nextInt(1_000_000)
                );

        PasswordResetToken resetToken =
                PasswordResetToken.builder()
                        .email(utilisateur.getEmail())
                        .code(code)
                        .expiration(
                                LocalDateTime.now()
                                        .plusMinutes(10)
                        )
                        .used(false)
                        .createdAt(LocalDateTime.now())
                        .build();

        passwordResetTokenRepository.save(
                resetToken
        );

        emailService.sendPasswordResetCode(
                utilisateur.getEmail(),
                code
        );
    }



    public void verifyResetCode(
            VerifyResetCodeRequestDto request
    ) {

        PasswordResetToken resetToken =
                passwordResetTokenRepository
                        .findByEmailAndCode(
                                request.getEmail(),
                                request.getCode()
                        )
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "Code incorrect."
                                )
                        );

        if (resetToken.isUsed()) {

            throw new IllegalStateException(
                    "Ce code a déjà été utilisé."
            );
        }

        if (resetToken.getExpiration()
                .isBefore(LocalDateTime.now())) {

            throw new IllegalStateException(
                    "Ce code a expiré."
            );
        }
    }




    @Transactional
    public void resetPassword(
            ResetPasswordRequestDto request
    ) {

        PasswordResetToken resetToken =
                passwordResetTokenRepository
                        .findByEmailAndCode(
                                request.getEmail(),
                                request.getCode()
                        )
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "Code incorrect."
                                )
                        );

        if (resetToken.isUsed()) {

            throw new IllegalStateException(
                    "Ce code a déjà été utilisé."
            );
        }

        if (resetToken.getExpiration()
                .isBefore(LocalDateTime.now())) {

            throw new IllegalStateException(
                    "Ce code a expiré."
            );
        }

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(
                                request.getEmail()
                        )
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "Utilisateur introuvable."
                                )
                        );

        // ========================================
        // Hachage du nouveau mot de passe
        // ========================================

        utilisateur.setPasswordHash(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );

        utilisateur.setUpdatedAt(
                LocalDateTime.now()
        );

        utilisateurRepository.save(
                utilisateur
        );

        // ========================================
        // Empêcher la réutilisation du code
        // ========================================

        resetToken.setUsed(true);

        passwordResetTokenRepository.save(
                resetToken
        );

        emailService.sendPasswordChangedConfirmation(
                utilisateur.getEmail()
        );
    }

}