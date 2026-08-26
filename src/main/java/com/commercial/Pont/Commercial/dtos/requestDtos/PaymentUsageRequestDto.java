package com.commercial.Pont.Commercial.dtos.requestDtos;

import com.commercial.Pont.Commercial.models.Paiement;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentUsageRequestDto {


    @Min(value = 1, message = "Le nombre de messages doit être supérieur à 0")
    private Integer nombreMessagesAchetes;


}