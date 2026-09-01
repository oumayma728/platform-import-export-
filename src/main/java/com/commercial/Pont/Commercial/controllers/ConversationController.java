package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.ConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.ConversationStatusRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.CreateConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.ConversationResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.enums.ConversationStatus;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.ConversationServiceInterface;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.MessageServiceInterface;
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
@RequestMapping("/conversations")
@RequiredArgsConstructor
@Tag(
        name = "Conversations",
        description = "Gestion des conversations entre utilisateurs autour des annonces"
)
public class ConversationController {

    private final ConversationServiceInterface conversationService;
    private final MessageServiceInterface messageService;



    // =========================
    // CREATE
    // =========================
    @Operation(
            summary = "Créer une conversation",
            description = "Crée une conversation à partir des informations fournies."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Conversation créée avec succès"),
            @ApiResponse(responseCode = "400", description = "Données de conversation invalides"),
            @ApiResponse(responseCode = "404", description = "Utilisateur ou annonce introuvable"),
            @ApiResponse(responseCode = "409", description = "Conversation déjà existante")
    })
    @PostMapping("/createConversation")
    public ResponseEntity<ConversationResponseDto> create(
            @RequestBody ConversationRequestDto conversationRequestDto
    ) {

        ConversationResponseDto response =
                conversationService.create(
                        conversationRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================
    // UPDATE
    // =========================
    @Operation(
            summary = "Modifier une conversation",
            description = "Modifie les informations d'une conversation existante."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Conversation modifiée avec succès"),
            @ApiResponse(responseCode = "400", description = "Données invalides"),
            @ApiResponse(responseCode = "404", description = "Conversation introuvable")
    })
    @PutMapping("/updateConversation/{conversationId}")
    public ResponseEntity<ConversationResponseDto> update(
            @Parameter(
                    description = "Identifiant UUID de la conversation",
                    required = true
            )
            @PathVariable UUID conversationId,
            @RequestBody ConversationRequestDto conversationRequestDto
    ) {

        ConversationResponseDto response =
                conversationService.update(
                        conversationId,
                        conversationRequestDto
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET BY ID
    // =========================
    @Operation(
            summary = "Récupérer une conversation",
            description = "Retourne les informations d'une conversation à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Conversation récupérée avec succès"),
            @ApiResponse(responseCode = "404", description = "Conversation introuvable")
    })
    @GetMapping("/getConversation/{conversationId}")
    public ResponseEntity<ConversationResponseDto> getById(
            @Parameter(
                    description = "Identifiant UUID de la conversation",
                    required = true
            )
            @PathVariable UUID conversationId
    ) {

        ConversationResponseDto response =
                conversationService.getById(
                        conversationId
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET ALL
    // =========================
    @Operation(
            summary = "Lister toutes les conversations",
            description = "Retourne toutes les conversations enregistrées."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Conversations récupérées avec succès")
    })
    @GetMapping("/getAllConversations")
    public ResponseEntity<List<ConversationResponseDto> > getAll() {

        List<ConversationResponseDto> response =
                conversationService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================
    // DELETE
    // =========================
    @Operation(
            summary = "Supprimer une conversation",
            description = "Supprime une conversation à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Conversation supprimée avec succès"),
            @ApiResponse(responseCode = "404", description = "Conversation introuvable")
    })
    @DeleteMapping("/deleteConversation/{conversationId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID conversationId
    ) {

        conversationService.delete(
                conversationId
        );

        return ResponseEntity.noContent().build();
    }




    @Operation(
            summary = "Modifier le statut d'une conversation",
            description = "Modifie le statut d'une conversation existante."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Statut modifié avec succès"),
            @ApiResponse(responseCode = "400", description = "Statut invalide ou transition interdite"),
            @ApiResponse(responseCode = "404", description = "Conversation introuvable")
    })
    @PutMapping("/{conversationId}/status")
    public ResponseEntity<ConversationResponseDto> updateStatus(
            @Parameter(
                    description = "Identifiant UUID de la conversation",
                    required = true
            )
            @PathVariable UUID conversationId,
            @RequestBody ConversationStatusRequestDto request
    ) {

        ConversationResponseDto response =
                conversationService.updateStatus(
                        conversationId,
                        request.getStatut()
                );

        return ResponseEntity.ok(response);
    }




    @Operation(
            summary = "Créer une conversation pour l'utilisateur connecté",
            description = """
                Crée une nouvelle conversation en utilisant automatiquement
                l'utilisateur actuellement authentifié comme participant.
                """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Conversation créée avec succès"),
            @ApiResponse(responseCode = "400", description = "Données invalides"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Utilisateur non autorisé"),
            @ApiResponse(responseCode = "404", description = "Annonce ou utilisateur destinataire introuvable"),
            @ApiResponse(responseCode = "409", description = "Conversation déjà existante")
    })
    @PostMapping("/createMyConversation")
    public ResponseEntity<ConversationResponseDto> create(
            @RequestBody CreateConversationRequestDto request,
            Authentication authentication)
    {

        ConversationResponseDto response =
                conversationService.createMyConversation(
                        request,
                        authentication
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }



    @Operation(
            summary = "Récupérer mes conversations",
            description = "Retourne toutes les conversations auxquelles participe l'utilisateur authentifié."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Conversations récupérées avec succès"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "404", description = "Utilisateur introuvable")
    })
    @GetMapping("/getMyConversations")
    public ResponseEntity<List<ConversationResponseDto>>
    getMyConversations(
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                conversationService.getMyConversations(
                        authentication
                )
        );
    }





    @Operation(
            summary = "Récupérer les messages d'une conversation",
            description = """
                Retourne les messages d'une conversation si l'utilisateur
                authentifié participe à cette conversation.
                """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Messages récupérés avec succès"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Utilisateur non participant à la conversation"),
            @ApiResponse(responseCode = "404", description = "Conversation introuvable")
    })
    @GetMapping("/getMyMessages/{conversationId}")
    public ResponseEntity<List<MessageResponseDto>>
    getMessages(
            @Parameter(
                    description = "Identifiant UUID de la conversation",
                    required = true
            )
            @PathVariable UUID conversationId,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                conversationService.getMessages(
                        conversationId,
                        authentication
                )
        );
    }




    @Operation(
            summary = "Modifier le statut de ma conversation",
            description = """
                Modifie le statut d'une conversation à laquelle
                participe l'utilisateur authentifié.
                """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Statut modifié avec succès"),
            @ApiResponse(responseCode = "400", description = "Statut invalide ou transition interdite"),
            @ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "403", description = "Utilisateur non participant à la conversation"),
            @ApiResponse(responseCode = "404", description = "Conversation introuvable")
    })
    @PutMapping("/updateStatusOfMyConversation/{conversationId}/status")
    public ResponseEntity<ConversationResponseDto>
    updateStatus(
            @Parameter(
                    description = "Identifiant UUID de la conversation",
                    required = true
            )
            @PathVariable UUID conversationId,
            @Parameter(
                    description = "Nouveau statut de la conversation",
                    required = true,
                    example = "EN_NEGOCIATION"
            )
            @RequestParam ConversationStatus statut,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                conversationService.updateStatus(
                        conversationId,
                        statut,
                        authentication
                )
        );
    }

}