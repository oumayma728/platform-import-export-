package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermAnnonceRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermAnnonceResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.IncotermAnnonceServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/incoterm-annonces")
@RequiredArgsConstructor
public class IncotermAnnonceController {

    private final IncotermAnnonceServiceInterface incotermAnnonceService;

    @PostMapping
    public ResponseEntity<IncotermAnnonceResponseDto> create(
            @RequestBody IncotermAnnonceRequestDto incotermAnnonceRequestDto
    ) {

        IncotermAnnonceResponseDto response =
                incotermAnnonceService.create(
                        incotermAnnonceRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{incotermAnnonceId}")
    public ResponseEntity<IncotermAnnonceResponseDto> update(
            @PathVariable UUID incotermAnnonceId,
            @RequestBody IncotermAnnonceRequestDto incotermAnnonceRequestDto
    ) {

        IncotermAnnonceResponseDto response =
                incotermAnnonceService.update(
                        incotermAnnonceId,
                        incotermAnnonceRequestDto
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{incotermAnnonceId}")
    public ResponseEntity<IncotermAnnonceResponseDto> getById(
            @PathVariable UUID incotermAnnonceId
    ) {

        IncotermAnnonceResponseDto response =
                incotermAnnonceService.getById(
                        incotermAnnonceId
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<IncotermAnnonceResponseDto>> getAll() {

        List<IncotermAnnonceResponseDto> response =
                incotermAnnonceService.getAll();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{incotermAnnonceId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID incotermAnnonceId
    ) {

        incotermAnnonceService.delete(
                incotermAnnonceId
        );

        return ResponseEntity.noContent().build();
    }
}