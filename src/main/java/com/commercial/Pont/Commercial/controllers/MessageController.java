package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.MessageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.MessageServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageServiceInterface messageService;

    @PostMapping
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

    @PutMapping("/{messageId}")
    public ResponseEntity<MessageResponseDto> update(
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

    @GetMapping("/{messageId}")
    public ResponseEntity<MessageResponseDto> getById(
            @PathVariable UUID messageId
    ) {

        MessageResponseDto response =
                messageService.getById(
                        messageId
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<MessageResponseDto>> getAll() {

        List<MessageResponseDto> response =
                messageService.getAll();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID messageId
    ) {

        messageService.delete(
                messageId
        );

        return ResponseEntity.noContent().build();
    }
}