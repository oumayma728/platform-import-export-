package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.ConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.ConversationResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.ConversationServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationServiceInterface conversationService;


    // =========================
    // CREATE
    // =========================

    @PostMapping
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

    @PutMapping("/{conversationId}")
    public ResponseEntity<ConversationResponseDto> update(
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

    @GetMapping("/{conversationId}")
    public ResponseEntity<ConversationResponseDto> getById(
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

    @GetMapping
    public ResponseEntity<List<ConversationResponseDto> > getAll() {

        List<ConversationResponseDto> response =
                conversationService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================
    // DELETE
    // =========================

    @DeleteMapping("/{conversationId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID conversationId
    ) {

        conversationService.delete(
                conversationId
        );

        return ResponseEntity.noContent().build();
    }
}