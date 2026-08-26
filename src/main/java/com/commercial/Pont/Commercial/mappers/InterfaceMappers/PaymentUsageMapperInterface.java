package com.commercial.Pont.Commercial.mappers.InterfaceMappers;

import com.commercial.Pont.Commercial.dtos.requestDtos.PaymentUsageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.PaymentUsageResponseDto;
import com.commercial.Pont.Commercial.models.PaymentUsage;

public interface PaymentUsageMapperInterface {

    PaymentUsage toEntity(PaymentUsageRequestDto dto);

    PaymentUsageResponseDto toResponseDto(PaymentUsage entity);
}