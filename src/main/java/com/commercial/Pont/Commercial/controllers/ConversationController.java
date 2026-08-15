package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.ConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.ConversationStatusRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.CreateConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.ConversationResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.enums.ConversationStatus;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.ConversationServiceInterface;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.MessageServiceInterface;
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
public class ConversationController {

    private final ConversationServiceInterface conversationService;
    private final MessageServiceInterface messageService;



    // =========================
    // CREATE
    // =========================

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

    @PutMapping("/updateConversation/{conversationId}")
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

    @GetMapping("/getConversation/{conversationId}")
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

    @GetMapping("/getAllConversations")
    public ResponseEntity<List<ConversationResponseDto> > getAll() {

        List<ConversationResponseDto> response =
                conversationService.getAll();

        return ResponseEntity.ok(response);
    }


    // =========================
    // DELETE
    // =========================

    @DeleteMapping("/deleteConversation/{conversationId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID conversationId
    ) {

        conversationService.delete(
                conversationId
        );

        return ResponseEntity.noContent().build();
    }





    @PutMapping("/{conversationId}/status")
    public ResponseEntity<ConversationResponseDto> updateStatus(
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





    @PostMapping("/createMyConversation")
    public ResponseEntity create(
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






    @GetMapping("/getMyMessages/{conversationId}")
    public ResponseEntity<List<MessageResponseDto>>
    getMessages(
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




    @PutMapping("/updateStatusOfMyConversation/{conversationId}/status")
    public ResponseEntity<ConversationResponseDto>
    updateStatus(
            @PathVariable UUID conversationId,
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