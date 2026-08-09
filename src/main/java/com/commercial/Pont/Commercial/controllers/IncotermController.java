package com.commercial.Pont.Commercial.controllers;

import com.commercial.Pont.Commercial.dtos.requestDtos.IncotermRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.IncotermResponseDto;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.IncotermServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/incoterms")
@RequiredArgsConstructor
public class IncotermController {

    private final IncotermServiceInterface incotermService;

    @PostMapping
    public ResponseEntity<IncotermResponseDto> create(
            @RequestBody IncotermRequestDto incotermRequestDto
    ) {

        IncotermResponseDto response =
                incotermService.create(
                        incotermRequestDto
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{incotermId}")
    public ResponseEntity<IncotermResponseDto> update(
            @PathVariable UUID incotermId,
            @RequestBody IncotermRequestDto incotermRequestDto
    ) {

        IncotermResponseDto response =
                incotermService.update(
                        incotermId,
                        incotermRequestDto
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{incotermId}")
    public ResponseEntity<IncotermResponseDto> getById(
            @PathVariable UUID incotermId
    ) {

        IncotermResponseDto response =
                incotermService.getById(
                        incotermId
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<IncotermResponseDto>> getAll() {

        List<IncotermResponseDto> response =
                incotermService.getAll();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{incotermId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID incotermId
    ) {

        incotermService.delete(
                incotermId
        );

        return ResponseEntity.noContent().build();
    }
}