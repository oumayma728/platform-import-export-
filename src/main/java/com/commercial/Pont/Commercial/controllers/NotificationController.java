package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.NotificationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.NotificationResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.NotificationServiceInterface;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Tag(
        name = "Notifications",
        description = "Gestion des notifications envoyées aux utilisateurs de la plateforme"
)
public class NotificationController {

    private final NotificationServiceInterface notificationService;


    // =========================================
    // CREATE
    // =========================================

    @Operation(
            summary = "Créer une notification",
            description = "Crée une nouvelle notification pour un utilisateur."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Notification créée avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données de notification invalides"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Utilisateur non authentifié"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Destinataire introuvable"
            )
    })
    @PostMapping
    public ResponseEntity<NotificationResponseDto> create(
            @RequestBody NotificationRequestDto notificationRequestDto
    ) {

        NotificationResponseDto response =
                notificationService.create(
                        notificationRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================================
    // UPDATE
    // =========================================

    @Operation(
            summary = "Modifier une notification",
            description = "Modifie les informations d'une notification existante."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Notification modifiée avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données invalides"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Notification introuvable"
            )
    })
    @PutMapping("/{notificationId}")
    public ResponseEntity<NotificationResponseDto> update(

            @Parameter(
                    description = "Identifiant UUID de la notification",
                    required = true
            )
            @PathVariable UUID notificationId,

            @RequestBody NotificationRequestDto notificationRequestDto
    ) {

        NotificationResponseDto response =
                notificationService.update(
                        notificationId,
                        notificationRequestDto
                );

        return ResponseEntity.ok(response);
    }


    // =========================================
    // GET BY ID
    // =========================================

    @Operation(
            summary = "Récupérer une notification",
            description = "Retourne une notification à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Notification récupérée avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Notification introuvable"
            )
    })
    @GetMapping("/{notificationId}")
    public ResponseEntity<NotificationResponseDto> getById(

            @Parameter(
                    description = "Identifiant UUID de la notification",
                    required = true
            )
            @PathVariable UUID notificationId
    ) {

        NotificationResponseDto response =
                notificationService.getById(
                        notificationId
                );

        return ResponseEntity.ok(response);
    }


    // =========================================
    // GET ALL
    // =========================================

    @Operation(
            summary = "Lister toutes les notifications",
            description = "Retourne toutes les notifications enregistrées."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Notifications récupérées avec succès"
            )
    })
    @GetMapping
    public ResponseEntity<List<NotificationResponseDto>> getAll() {

        List<NotificationResponseDto> response =
                notificationService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================================
    // DELETE
    // =========================================

    @Operation(
            summary = "Supprimer une notification",
            description = "Supprime une notification à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Notification supprimée avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Notification introuvable"
            )
    })
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> delete(

            @Parameter(
                    description = "Identifiant UUID de la notification",
                    required = true
            )
            @PathVariable UUID notificationId
    ) {

        notificationService.delete(
                notificationId
        );

        return ResponseEntity.noContent().build();
    }


    // =========================================
    // MARK AS READ
    // =========================================

    @Operation(
            summary = "Marquer une notification comme lue",
            description = """
                    Marque une notification comme lue.

                    L'utilisateur authentifié doit être le destinataire
                    de cette notification.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Notification marquée comme lue"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Utilisateur non authentifié"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "La notification n'appartient pas à l'utilisateur"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Notification introuvable"
            )
    })
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<String> markAsRead(

            @Parameter(
                    description = "Identifiant UUID de la notification",
                    required = true
            )
            @PathVariable UUID notificationId,

            Authentication authentication
    ) {

        notificationService.markAsRead(
                notificationId,
                authentication
        );

        return ResponseEntity.ok(
                "Notification marquée comme lue"
        );
    }
}