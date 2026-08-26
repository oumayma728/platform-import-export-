package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentConversationResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.DocumentConversationServiceInterface;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/documents-conversations")
@RequiredArgsConstructor
public class DocumentConversationController {

    private final DocumentConversationServiceInterface
            documentConversationService;


    // =========================================================
    // UPDATE
    // =========================================================

    @PutMapping("/{documentConversationId}")
    public ResponseEntity<DocumentConversationResponseDto> update(
            @PathVariable UUID documentConversationId,

            @RequestBody DocumentConversationRequestDto
                    documentConversationRequestDto
    ) {

        DocumentConversationResponseDto response =
                documentConversationService.update(
                        documentConversationId,
                        documentConversationRequestDto
                );

        return ResponseEntity.ok(response);
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    @GetMapping("/{documentConversationId}")
    public ResponseEntity<DocumentConversationResponseDto> getById(
            @PathVariable UUID documentConversationId
    ) {

        DocumentConversationResponseDto response =
                documentConversationService.getById(
                        documentConversationId
                );

        return ResponseEntity.ok(response);
    }


    // =========================================================
    // GET ALL
    // =========================================================

    @GetMapping
    public ResponseEntity<
            List<DocumentConversationResponseDto>
            > getAll() {

        List<DocumentConversationResponseDto> response =
                documentConversationService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================================================
    // DELETE GENERIC
    // =========================================================

    @DeleteMapping("/{documentConversationId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID documentConversationId
    ) {

        documentConversationService.delete(
                documentConversationId
        );

        return ResponseEntity
                .noContent()
                .build();
    }


    // =========================================================
    // ADD DOCUMENT TO CONVERSATION
    // =========================================================
    //
    // POST
    // /documents-conversations/conversations/{conversationId}/documents
    //
    // Authorization: Bearer JWT
    //
    // Body:
    // multipart/form-data
    // file = fichier.pdf
    //
    // L'utilisateur est récupéré depuis le JWT
    // =========================================================

    @PostMapping(
            value = "/conversations/{conversationId}/documents",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<DocumentConversationResponseDto>
    addDocumentToConversation(

            @PathVariable UUID conversationId,

            @RequestPart("file") MultipartFile file

    ) {

        DocumentConversationResponseDto response =
                documentConversationService
                        .addDocumentToConversation(
                                conversationId,
                                file
                        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================================================
    // GET DOCUMENTS BY CONVERSATION
    // =========================================================
    //
    // GET
    // /documents-conversations/conversations/{conversationId}/documents
    //
    // Authorization: Bearer JWT
    // =========================================================

    @GetMapping(
            "/conversations/{conversationId}/documents"
    )
    public ResponseEntity<
            List<DocumentConversationResponseDto>
            > getDocumentsByConversation(

            @PathVariable UUID conversationId

    ) {

        List<DocumentConversationResponseDto> response =
                documentConversationService
                        .getDocumentsByConversation(
                                conversationId
                        );

        return ResponseEntity.ok(response);
    }


    // =========================================================
    // DELETE DOCUMENT FROM CONVERSATION
    // =========================================================
    //
    // DELETE
    // /documents-conversations/conversations/{conversationId}/documents/{documentConversationId}
    //
    // Authorization: Bearer JWT
    // =========================================================

    @DeleteMapping(
            "/conversations/{conversationId}/documents/{documentConversationId}"
    )
    public ResponseEntity<Void>
    deleteDocumentFromConversation(

            @PathVariable UUID conversationId,

            @PathVariable UUID documentConversationId

    ) {

        documentConversationService
                .deleteDocumentFromConversation(
                        conversationId,
                        documentConversationId
                );

        return ResponseEntity
                .noContent()
                .build();
    }



    @PatchMapping("/{documentConversationId}/read")
    public ResponseEntity<DocumentConversationResponseDto> markAsRead(
            @PathVariable UUID documentConversationId,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                documentConversationService.markAsRead(
                        documentConversationId,
                        authentication
                )
        );
    }
}