package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.CreateMessageRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.MessageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.MessageServiceInterface;
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
public class MessageController {

    private final MessageServiceInterface messageService;

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





    @PatchMapping("/{messageId}/read")
    public ResponseEntity<MessageResponseDto> markAsRead(
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





    @GetMapping("/conversation/{conversationId}/read")
    public ResponseEntity<List<MessageResponseDto>> getReadMessages(
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



    @GetMapping("/conversation/{conversationId}/unread")
    public ResponseEntity<List<MessageResponseDto>> getUnreadMessages(
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


    @PutMapping("/updateMessage/{messageId}")
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

    @GetMapping("/getMessage/{messageId}")
    public ResponseEntity<MessageResponseDto> getById(
            @PathVariable UUID messageId
    ) {

        MessageResponseDto response =
                messageService.getById(
                        messageId
                );

        return ResponseEntity.ok(response);
    }





    @GetMapping("/getMessagesOfConversation/{conversationId}")
    public ResponseEntity<List<MessageResponseDto>> getByConversation(
            @PathVariable UUID conversationId
    ) {

        List<MessageResponseDto> response =
                messageService.getByConversationId(
                        conversationId
                );

        return ResponseEntity.ok(response);
    }


    @GetMapping("getAllMessages")
    public ResponseEntity<List<MessageResponseDto>> getAll() {

        List<MessageResponseDto> response =
                messageService.getAll();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/deleteMessage/{messageId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID messageId
    ) {

        messageService.delete(
                messageId
        );

        return ResponseEntity.noContent().build();
    }
}