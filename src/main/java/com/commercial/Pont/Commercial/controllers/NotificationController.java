package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.NotificationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.NotificationResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.NotificationServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationServiceInterface notificationService;

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

    @PutMapping("/{notificationId}")
    public ResponseEntity<NotificationResponseDto> update(
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

    @GetMapping("/{notificationId}")
    public ResponseEntity<NotificationResponseDto> getById(
            @PathVariable UUID notificationId
    ) {

        NotificationResponseDto response =
                notificationService.getById(
                        notificationId
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponseDto>> getAll() {

        List<NotificationResponseDto> response =
                notificationService.getAll();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID notificationId
    ) {

        notificationService.delete(
                notificationId
        );

        return ResponseEntity.noContent().build();
    }
}