package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.ConversationRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.ConversationResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.ConversationMapperInterface;
import com.commercial.Pont.Commercial.models.Conversation;
import com.commercial.Pont.Commercial.repositories.ConversationRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.ConversationServiceInterface;
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
public class ConversationServiceImpl
        implements ConversationServiceInterface {

    private final ConversationRepository conversationRepository;

    private final ConversationMapperInterface conversationMapper;


    // =========================
    // CREATE
    // =========================

    @Override
    public ConversationResponseDto create(
            ConversationRequestDto conversationRequestDto
    ) {

        Conversation conversation =
                conversationMapper.requestToEntity(
                        conversationRequestDto
                );

        LocalDateTime now = LocalDateTime.now();

        conversation.setCreatedAt(now);
        conversation.setUpdatedAt(now);

        Conversation savedConversation =
                conversationRepository.save(
                        conversation
                );

        return conversationMapper.entityToResponse(
                savedConversation
        );
    }


    // =========================
    // UPDATE
    // =========================

    @Override
    public ConversationResponseDto update(
            UUID conversationId,
            ConversationRequestDto conversationRequestDto
    ) {

        Conversation existingConversation =
                conversationRepository.findById(
                                conversationId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Conversation non trouvée avec l'id : "
                                                + conversationId
                                )
                        );


        // =========================
        // Informations principales
        // =========================

        existingConversation.setStatut(
                conversationRequestDto.getStatut()
        );

        existingConversation.setDateDernierMessage(
                conversationRequestDto.getDateDernierMessage()
        );

        existingConversation.setNombreMessages(
                conversationRequestDto.getNombreMessages()
        );


        // =========================
        // Mise à jour automatique
        // =========================

        existingConversation.setUpdatedAt(
                LocalDateTime.now()
        );


        Conversation updatedConversation =
                conversationRepository.save(
                        existingConversation
                );

        return conversationMapper.entityToResponse(
                updatedConversation
        );
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public ConversationResponseDto getById(
            UUID conversationId
    ) {

        Conversation conversation =
                conversationRepository.findById(
                                conversationId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Conversation non trouvée avec l'id : "
                                                + conversationId
                                )
                        );

        return conversationMapper.entityToResponse(
                conversation
        );
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponseDto> getAll() {

        return conversationRepository.findAll()
                .stream()
                .map(
                        conversationMapper::entityToResponse
                )
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID conversationId
    ) {

        if (!conversationRepository.existsById(
                conversationId
        )) {

            throw new EntityNotFoundException(
                    "Conversation non trouvée avec l'id : "
                            + conversationId
            );
        }

        conversationRepository.deleteById(
                conversationId
        );
    }
}