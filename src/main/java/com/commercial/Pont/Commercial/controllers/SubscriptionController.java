package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.CreateSubscriptionRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.SubscriptionRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.CreateSubscriptionResponseDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.SubscriptionResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.SubscriptionServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionServiceInterface subscriptionService;



    @PostMapping("/create-payment")
    public ResponseEntity<CreateSubscriptionResponseDto>
    createSubscriptionPayment(
            @RequestBody
            CreateSubscriptionRequestDto request,

            Authentication authentication
    ) {

        return ResponseEntity.ok(
                subscriptionService
                        .creerPaiementSubscription(
                                request.getAbonnementId(),
                                authentication
                        )
        );
    }




    @PostMapping
    public ResponseEntity<SubscriptionResponseDto> create(
            @RequestBody SubscriptionRequestDto subscriptionRequestDto
    ) {
        SubscriptionResponseDto response =
                subscriptionService.create(subscriptionRequestDto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{subscriptionId}")
    public ResponseEntity<SubscriptionResponseDto> update(
            @PathVariable UUID subscriptionId,
            @RequestBody SubscriptionRequestDto subscriptionRequestDto
    ) {
        return ResponseEntity.ok(
                subscriptionService.update(
                        subscriptionId,
                        subscriptionRequestDto
                )
        );
    }

    @GetMapping("/{subscriptionId}")
    public ResponseEntity<SubscriptionResponseDto> getById(
            @PathVariable UUID subscriptionId
    ) {
        return ResponseEntity.ok(
                subscriptionService.getById(subscriptionId)
        );
    }

    @GetMapping
    public ResponseEntity<List<SubscriptionResponseDto>> getAll() {
        return ResponseEntity.ok(
                subscriptionService.getAll()
        );
    }

    @DeleteMapping("/{subscriptionId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID subscriptionId
    ) {
        subscriptionService.delete(subscriptionId);
        return ResponseEntity.noContent().build();
    }

}
