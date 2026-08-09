package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.ResponseMessages.TextResponseDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.*;
import com.commercial.Pont.Commercial.dtos.responseDtos.AuthResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.UtilisateurResponseDto;
import com.commercial.Pont.Commercial.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public AuthResponseDto login(
            @RequestBody LoginRequestDto request
    ) {

        return authService.login(
                request
        );
    }


    @PostMapping("/refresh")
    public AuthResponseDto refreshToken(
            @RequestBody RefreshTokenRequestDto request
    ) {

        return authService.refreshToken(
                request
        );
    }





    @PostMapping("/register")
    public ResponseEntity<TextResponseDto> register(
            @Valid @RequestBody UtilisateurRequestDto request
    ) {

        authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        new TextResponseDto(
                                "Votre demande d'inscription a été envoyée avec succès. " +
                                        "Elle est actuellement en attente de validation."
                        )
                );
    }



    @GetMapping("/profile")
    public ResponseEntity<UtilisateurResponseDto> getProfile(
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                authService.getProfile(authentication)
        );
    }



    @PutMapping("/profile")
    public ResponseEntity<UtilisateurResponseDto> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequestDto request
    ) {

        return ResponseEntity.ok(
                authService.updateProfile(
                        authentication,
                        request
                )
        );
    }





    @PostMapping("/forgot-password")
    public ResponseEntity<TextResponseDto> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequestDto request
    ) {

        authService.forgotPassword(request);

        return ResponseEntity.ok(
                new TextResponseDto(
                        "Un code de réinitialisation a été envoyé à votre adresse email."
                )
        );
    }


    @PostMapping("/verify-reset-code")
    public ResponseEntity<TextResponseDto> verifyResetCode(
            @Valid @RequestBody VerifyResetCodeRequestDto request
    ) {

        authService.verifyResetCode(request);

        return ResponseEntity.ok(
                new TextResponseDto(
                        "Code valide."
                )
        );
    }


    @PostMapping("/reset-password")
    public ResponseEntity<TextResponseDto> resetPassword(
            @Valid @RequestBody ResetPasswordRequestDto request
    ) {

        authService.resetPassword(request);

        return ResponseEntity.ok(
                new TextResponseDto(
                        "Votre mot de passe a été modifié avec succès."
                )
        );
    }

}