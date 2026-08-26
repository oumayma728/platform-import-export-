package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.AbonnementRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.AbonnementResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.AbonnementMapperInterface;
import com.commercial.Pont.Commercial.models.Abonnement;
import com.commercial.Pont.Commercial.repositories.AbonnementRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.AbonnementServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AbonnementServiceImpl implements AbonnementServiceInterface {

    private final AbonnementRepository abonnementRepository;
    private final AbonnementMapperInterface abonnementMapper;

    @Override
    public AbonnementResponseDto create(AbonnementRequestDto abonnementRequestDto) {

        Abonnement abonnement = abonnementMapper.requestToEntity(abonnementRequestDto);

        Abonnement savedAbonnement = abonnementRepository.save(abonnement);

        return abonnementMapper.entityToResponse(savedAbonnement);
    }

    @Override
    public AbonnementResponseDto update(
            UUID abonnementId,
            AbonnementRequestDto abonnementRequestDto
    ) {

        Abonnement existingAbonnement = abonnementRepository.findById(abonnementId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Abonnement non trouvé avec l'id : " + abonnementId
                ));

        existingAbonnement.setNom(abonnementRequestDto.getNom());
        existingAbonnement.setTypeAbonnement(
                abonnementRequestDto.getTypeAbonnement()
        );
        existingAbonnement.setDureeEnMois(
                abonnementRequestDto.getDureeEnMois()
        );

        existingAbonnement.setStatut(
                abonnementRequestDto.getStatut()
        );

        existingAbonnement.setUpdatedAt(LocalDateTime.now());

        Abonnement updatedAbonnement =
                abonnementRepository.save(existingAbonnement);

        return abonnementMapper.entityToResponse(updatedAbonnement);
    }

    @Override
    @Transactional(readOnly = true)
    public AbonnementResponseDto getById(UUID abonnementId) {

        Abonnement abonnement = abonnementRepository.findById(abonnementId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Abonnement non trouvé avec l'id : " + abonnementId
                ));

        return abonnementMapper.entityToResponse(abonnement);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AbonnementResponseDto> getAll() {

        return abonnementRepository.findAll()
                .stream()
                .map(abonnementMapper::entityToResponse)
                .toList();
    }

    @Override
    public void delete(UUID abonnementId) {

        if (!abonnementRepository.existsById(abonnementId)) {
            throw new EntityNotFoundException(
                    "Abonnement non trouvé avec l'id : " + abonnementId
            );
        }

        abonnementRepository.deleteById(abonnementId);
    }
}