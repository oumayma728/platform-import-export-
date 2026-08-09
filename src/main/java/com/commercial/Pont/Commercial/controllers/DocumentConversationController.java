package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.DocumentConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.DocumentConversationResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.DocumentConversationServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents-conversations")
@RequiredArgsConstructor
public class DocumentConversationController {

    private final DocumentConversationServiceInterface documentConversationService;


    // =========================
    // CREATE
    // =========================

    @PostMapping
    public ResponseEntity<DocumentConversationResponseDto> create(
            @RequestBody DocumentConversationRequestDto documentConversationRequestDto
    ) {

        DocumentConversationResponseDto response =
                documentConversationService.create(
                        documentConversationRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================
    // UPDATE
    // =========================

    @PutMapping("/{documentConversationId}")
    public ResponseEntity<DocumentConversationResponseDto> update(
            @PathVariable UUID documentConversationId,
            @RequestBody DocumentConversationRequestDto documentConversationRequestDto
    ) {

        DocumentConversationResponseDto response =
                documentConversationService.update(
                        documentConversationId,
                        documentConversationRequestDto
                );

        return ResponseEntity.ok(response);
    }


    // =========================
    // GET BY ID
    // =========================

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


    // =========================
    // GET ALL
    // =========================

    @GetMapping
    public ResponseEntity<List<DocumentConversationResponseDto>> getAll() {

        List<DocumentConversationResponseDto> response =
                documentConversationService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================
    // DELETE
    // =========================

    @DeleteMapping("/{documentConversationId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID documentConversationId
    ) {

        documentConversationService.delete(
                documentConversationId
        );

        return ResponseEntity.noContent().build();
    }
}