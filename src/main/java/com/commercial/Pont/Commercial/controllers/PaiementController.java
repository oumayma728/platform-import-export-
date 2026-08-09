package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.PaiementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaiementResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.PaiementServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/paiements")
@RequiredArgsConstructor
public class PaiementController {

    private final PaiementServiceInterface paiementService;

    @PostMapping
    public ResponseEntity<PaiementResponseDto> create(
            @RequestBody PaiementRequestDto paiementRequestDto
    ) {
        PaiementResponseDto response =
                paiementService.create(paiementRequestDto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{paiementId}")
    public ResponseEntity<PaiementResponseDto> update(
            @PathVariable UUID paiementId,
            @RequestBody PaiementRequestDto paiementRequestDto
    ) {
        return ResponseEntity.ok(
                paiementService.update(paiementId, paiementRequestDto)
        );
    }

    @GetMapping("/{paiementId}")
    public ResponseEntity<PaiementResponseDto> getById(
            @PathVariable UUID paiementId
    ) {
        return ResponseEntity.ok(
                paiementService.getById(paiementId)
        );
    }

    @GetMapping
    public ResponseEntity<List<PaiementResponseDto>> getAll() {
        return ResponseEntity.ok(
                paiementService.getAll()
        );
    }

    @DeleteMapping("/{paiementId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID paiementId
    ) {
        paiementService.delete(paiementId);
        return ResponseEntity.noContent().build();
    }

}
