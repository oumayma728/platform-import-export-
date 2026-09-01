package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.CreateMessageRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.MessageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
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
@RequestMapping("/messages")
@RequiredArgsConstructor
@Tag(
        name = "Messages",
        description = "Gestion des messages échangés entre les utilisateurs dans les conversations"
)
public class MessageController {

    private final MessageServiceInterface messageService;


    // =========================================
    // CREATE
    // =========================================

    @Operation(
            summary = "Créer un message",
            description = "Crée un nouveau message dans une conversation."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Message créé avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données du message invalides ou quota atteint"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Conversation ou utilisateur introuvable"
            )
    })
    @PostMapping("/createMessage")
    public ResponseEntity<MessageResponseDto> create(
            @RequestBody MessageRequestDto messageRequestDto
    ) {

        MessageResponseDto response =
                messageService.create(
                        messageRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================================
    // CREATE MY MESSAGE
    // =========================================

    @Operation(
            summary = "Envoyer un message",
            description = """
                    Envoie un message depuis l'utilisateur actuellement
                    authentifié vers une conversation.

                    Le quota de messages de l'utilisateur est vérifié.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Message envoyé avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Message invalide ou quota de messages atteint"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Utilisateur non authentifié"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Utilisateur non participant à la conversation"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Conversation introuvable"
            )
    })
    @PostMapping("/createMyMessage")
    public ResponseEntity<MessageResponseDto> createMyMessage(
            @RequestBody CreateMessageRequestDto messageRequestDto,
            Authentication authentication
    ) {

        MessageResponseDto response =
                messageService.createMyMessage(
                        messageRequestDto,
                        authentication
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================================
    // MARK AS READ
    // =========================================

    @Operation(
            summary = "Marquer un message comme lu",
            description = "Marque un message reçu comme lu par l'utilisateur authentifié."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Message marqué comme lu"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Utilisateur non authentifié"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Utilisateur non autorisé à lire ce message"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Message introuvable"
            )
    })
    @PatchMapping("/{messageId}/read")
    public ResponseEntity<MessageResponseDto> markAsRead(

            @Parameter(
                    description = "Identifiant UUID du message",
                    required = true
            )
            @PathVariable UUID messageId,

            Authentication authentication
    ) {

        return ResponseEntity.ok(
                messageService.markAsRead(
                        messageId,
                        authentication
                )
        );
    }


    // =========================================
    // GET READ MESSAGES
    // =========================================

    @Operation(
            summary = "Lister les messages lus d'une conversation",
            description = """
                    Retourne les messages déjà lus d'une conversation
                    pour l'utilisateur authentifié.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Messages lus récupérés avec succès"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Utilisateur non authentifié"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Utilisateur non participant à la conversation"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Conversation introuvable"
            )
    })
    @GetMapping("/conversation/{conversationId}/read")
    public ResponseEntity<List<MessageResponseDto>> getReadMessages(

            @Parameter(
                    description = "Identifiant UUID de la conversation",
                    required = true
            )
            @PathVariable UUID conversationId,

            Authentication authentication
    ) {

        return ResponseEntity.ok(
                messageService.getReadMessages(
                        conversationId,
                        authentication
                )
        );
    }


    // =========================================
    // GET UNREAD MESSAGES
    // =========================================

    @Operation(
            summary = "Lister les messages non lus d'une conversation",
            description = """
                    Retourne les messages non lus d'une conversation
                    pour l'utilisateur authentifié.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Messages non lus récupérés avec succès"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Utilisateur non authentifié"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Utilisateur non participant à la conversation"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Conversation introuvable"
            )
    })
    @GetMapping("/conversation/{conversationId}/unread")
    public ResponseEntity<List<MessageResponseDto>> getUnreadMessages(

            @Parameter(
                    description = "Identifiant UUID de la conversation",
                    required = true
            )
            @PathVariable UUID conversationId,

            Authentication authentication
    ) {

        return ResponseEntity.ok(
                messageService.getUnreadMessages(
                        conversationId,
                        authentication
                )
        );
    }


    // =========================================
    // UPDATE
    // =========================================

    @Operation(
            summary = "Modifier un message",
            description = "Modifie le contenu ou les informations d'un message existant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Message modifié avec succès"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données du message invalides"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Message introuvable"
            )
    })
    @PutMapping("/updateMessage/{messageId}")
    public ResponseEntity<MessageResponseDto> update(

            @Parameter(
                    description = "Identifiant UUID du message",
                    required = true
            )
            @PathVariable UUID messageId,

            @RequestBody MessageRequestDto messageRequestDto
    ) {

        MessageResponseDto response =
                messageService.update(
                        messageId,
                        messageRequestDto
                );

        return ResponseEntity.ok(response);
    }


    // =========================================
    // GET BY ID
    // =========================================

    @Operation(
            summary = "Récupérer un message",
            description = "Retourne un message à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Message récupéré avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Message introuvable"
            )
    })
    @GetMapping("/getMessage/{messageId}")
    public ResponseEntity<MessageResponseDto> getById(

            @Parameter(
                    description = "Identifiant UUID du message",
                    required = true
            )
            @PathVariable UUID messageId
    ) {

        MessageResponseDto response =
                messageService.getById(
                        messageId
                );

        return ResponseEntity.ok(response);
    }


    // =========================================
    // GET BY CONVERSATION
    // =========================================

    @Operation(
            summary = "Lister les messages d'une conversation",
            description = "Retourne tous les messages associés à une conversation."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Messages récupérés avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Conversation introuvable"
            )
    })
    @GetMapping("/getMessagesOfConversation/{conversationId}")
    public ResponseEntity<List<MessageResponseDto>> getByConversation(

            @Parameter(
                    description = "Identifiant UUID de la conversation",
                    required = true
            )
            @PathVariable UUID conversationId
    ) {

        List<MessageResponseDto> response =
                messageService.getByConversationId(
                        conversationId
                );

        return ResponseEntity.ok(response);
    }


    // =========================================
    // GET ALL
    // =========================================

    @Operation(
            summary = "Lister tous les messages",
            description = "Retourne tous les messages enregistrés."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Messages récupérés avec succès"
            )
    })
    @GetMapping("/getAllMessages")
    public ResponseEntity<List<MessageResponseDto>> getAll() {

        List<MessageResponseDto> response =
                messageService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================================
    // DELETE
    // =========================================

    @Operation(
            summary = "Supprimer un message",
            description = "Supprime un message à partir de son identifiant."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Message supprimé avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Message introuvable"
            )
    })
    @DeleteMapping("/deleteMessage/{messageId}")
    public ResponseEntity<Void> delete(

            @Parameter(
                    description = "Identifiant UUID du message",
                    required = true
            )
            @PathVariable UUID messageId
    ) {

        messageService.delete(
                messageId
        );

        return ResponseEntity.noContent().build();
    }
}