package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.ResponseMessages.TextResponseDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.*;
import com.commercial.Pont.Commercial.dtos.responseDtos.AuthResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.UtilisateurResponseDto;
import com.commercial.Pont.Commercial.services.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(
        name = "Authentification",
        description = "Authentification, gestion des tokens JWT, inscription, profil et récupération du mot de passe"
)
public class AuthController {

    private final AuthService authService;


    @Operation(
            summary = "Authentifier un utilisateur",
            description = "Authentifie un utilisateur avec son email et son mot de passe et retourne les tokens JWT.",
            security = {}
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Authentification réussie"),
            @ApiResponse(responseCode = "400", description = "Requête invalide"),
            @ApiResponse(responseCode = "401", description = "Email ou mot de passe incorrect"),
            @ApiResponse(responseCode = "403", description = "Compte non autorisé, suspendu ou en attente de validation")
    })
    @PostMapping("/login")
    public AuthResponseDto login(
            @RequestBody LoginRequestDto request
    ) {

        return authService.login(
                request
        );
    }



    @Operation(
            summary = "Rafraîchir le token JWT",
            description = "Génère un nouveau token d'accès à partir d'un refresh token valide.",
            security = {}
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Nouveau token généré avec succès"),
            @ApiResponse(responseCode = "400", description = "Refresh token manquant ou invalide"),
            @ApiResponse(responseCode = "401", description = "Refresh token expiré ou non valide")
    })
    @PostMapping("/refresh")
    public AuthResponseDto refreshToken(
            @RequestBody RefreshTokenRequestDto request
    ) {

        return authService.refreshToken(
                request
        );
    }




    @Operation(
            summary = "Créer une demande d'inscription",
            description = """
                Enregistre un nouvel utilisateur sur la plateforme.

                La requête utilise multipart/form-data :
                - utilisateur : informations de l'utilisateur
                - photo : photo de profil optionnelle

                Après l'inscription, le compte reste en attente de validation.
                """,
            security = {}
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Demande d'inscription créée avec succès"),
            @ApiResponse(responseCode = "400", description = "Données d'inscription ou fichier invalides"),
            @ApiResponse(responseCode = "409", description = "Un compte existe déjà avec cet email")
    })
    @PostMapping(
            value = "/register",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<TextResponseDto> register(
            @Parameter(
                    description = "Informations du nouvel utilisateur",
                    required = true
            )
            @Valid @RequestPart("utilisateur") UtilisateurRequestDto request,

            @Parameter(
                    description = "Photo de profil optionnelle"
            )
            @RequestPart(value = "photo", required = false) MultipartFile photo
    ) {

        authService.register(
                request,
                photo
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        new TextResponseDto(
                                "Votre demande d'inscription a été envoyée avec succès. "
                                        + "Elle est actuellement en attente de validation."
                        )
                );
    }




    @Operation(
            summary = "Récupérer mon profil",
            description = "Retourne les informations du profil de l'utilisateur actuellement authentifié."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profil récupéré avec succès"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "404", description = "Utilisateur introuvable")
    })
    @GetMapping("/profile")
    public ResponseEntity<UtilisateurResponseDto> getProfile(
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                authService.getProfile(authentication)
        );
    }


    @Operation(
            summary = "Modifier mon profil",
            description = "Modifie les informations du profil de l'utilisateur actuellement authentifié."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profil modifié avec succès"),
            @ApiResponse(responseCode = "400", description = "Données du profil invalides"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "404", description = "Utilisateur introuvable"),
            @ApiResponse(responseCode = "409", description = "Une donnée unique du profil est déjà utilisée")
    })
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





    @Operation(
            summary = "Demander la réinitialisation du mot de passe",
            description = "Envoie un code de réinitialisation à l'adresse email de l'utilisateur.",
            security = {}
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Code de réinitialisation envoyé"),
            @ApiResponse(responseCode = "400", description = "Adresse email invalide"),
            @ApiResponse(responseCode = "404", description = "Aucun utilisateur associé à cette adresse email")
    })
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



    @Operation(
            summary = "Vérifier le code de réinitialisation",
            description = "Vérifie que le code de réinitialisation du mot de passe est valide.",
            security = {}
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Code de réinitialisation valide"),
            @ApiResponse(responseCode = "400", description = "Code invalide ou expiré"),
            @ApiResponse(responseCode = "404", description = "Demande de réinitialisation introuvable")
    })
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



    @Operation(
            summary = "Réinitialiser le mot de passe",
            description = "Définit un nouveau mot de passe après validation du processus de réinitialisation.",
            security = {}
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Mot de passe modifié avec succès"),
            @ApiResponse(responseCode = "400", description = "Données invalides, code incorrect ou code expiré"),
            @ApiResponse(responseCode = "404", description = "Utilisateur ou demande de réinitialisation introuvable")
    })
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