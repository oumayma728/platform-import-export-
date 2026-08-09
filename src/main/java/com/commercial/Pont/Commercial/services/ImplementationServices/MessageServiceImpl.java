package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.MessageRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.MessageResponseDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.MessageMapperInterface;
import com.commercial.Pont.Commercial.models.Conversation;
import com.commercial.Pont.Commercial.models.Message;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.ConversationRepository;
import com.commercial.Pont.Commercial.repositories.MessageRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.MessageServiceInterface;
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
public class MessageServiceImpl implements MessageServiceInterface {

    private final MessageRepository messageRepository;

    private final MessageMapperInterface messageMapper;

    private final ConversationRepository conversationRepository;

    private final UtilisateurRepository utilisateurRepository;


    // =========================
    // CREATE
    // =========================

    @Override
    public MessageResponseDto create(
            MessageRequestDto messageRequestDto
    ) {

        Message message =
                messageMapper.requestToEntity(
                        messageRequestDto
                );


        // =========================
        // Recherche de la conversation
        // =========================

        Conversation conversation =
                conversationRepository.findById(
                                messageRequestDto
                                        .getConversationId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Conversation non trouvée avec l'id : "
                                                + messageRequestDto
                                                .getConversationId()
                                )
                        );


        // =========================
        // Recherche de l'expéditeur
        // =========================

        Utilisateur utilisateur =
                utilisateurRepository.findById(
                                messageRequestDto
                                        .getExpediteurId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur non trouvé avec l'id : "
                                                + messageRequestDto
                                                .getExpediteurId()
                                )
                        );


        // =========================
        // Association des relations
        // =========================

        message.setConversation(
                conversation
        );

        message.setUtilisateur(
                utilisateur
        );


        // =========================
        // Gestion des valeurs par défaut
        // =========================

        if (message.getEstLu() == null) {
            message.setEstLu(false);
        }

        LocalDateTime now =
                LocalDateTime.now();

        if (message.getDateEnvoi() == null) {
            message.setDateEnvoi(now);
        }

        message.setCreatedAt(now);
        message.setUpdatedAt(now);


        // =========================
        // Sauvegarde
        // =========================

        Message savedMessage =
                messageRepository.save(
                        message
                );

        return messageMapper.entityToResponse(
                savedMessage
        );
    }


    // =========================
    // UPDATE
    // =========================

    @Override
    public MessageResponseDto update(
            UUID messageId,
            MessageRequestDto messageRequestDto
    ) {

        Message existingMessage =
                messageRepository.findById(
                                messageId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Message non trouvé avec l'id : "
                                                + messageId
                                )
                        );


        // =========================
        // Mise à jour du contenu
        // =========================

        existingMessage.setContenu(
                messageRequestDto.getContenu()
        );

        existingMessage.setEstLu(
                messageRequestDto.getEstLu()
        );

        existingMessage.setDateEnvoi(
                messageRequestDto.getDateEnvoi()
        );

        existingMessage.setDateLecture(
                messageRequestDto.getDateLecture()
        );

        existingMessage.setPrixMessage(
                messageRequestDto.getPrixMessage()
        );


        // =========================
        // Mise à jour de la conversation
        // =========================

        if (
                messageRequestDto.getConversationId() != null
                        &&
                        (
                                existingMessage.getConversation() == null
                                        ||
                                        !messageRequestDto
                                                .getConversationId()
                                                .equals(
                                                        existingMessage
                                                                .getConversation()
                                                                .getConversationId()
                                                )
                        )
        ) {

            Conversation conversation =
                    conversationRepository.findById(
                                    messageRequestDto
                                            .getConversationId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Conversation non trouvée avec l'id : "
                                                    + messageRequestDto
                                                    .getConversationId()
                                    )
                            );

            existingMessage.setConversation(
                    conversation
            );
        }


        // =========================
        // Mise à jour de l'expéditeur
        // =========================

        if (
                messageRequestDto.getExpediteurId() != null
                        &&
                        (
                                existingMessage.getUtilisateur() == null
                                        ||
                                        !messageRequestDto
                                                .getExpediteurId()
                                                .equals(
                                                        existingMessage
                                                                .getUtilisateur()
                                                                .getUtilisateurId()
                                                )
                        )
        ) {

            Utilisateur utilisateur =
                    utilisateurRepository.findById(
                                    messageRequestDto
                                            .getExpediteurId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Utilisateur non trouvé avec l'id : "
                                                    + messageRequestDto
                                                    .getExpediteurId()
                                    )
                            );

            existingMessage.setUtilisateur(
                    utilisateur
            );
        }


        // =========================
        // Mise à jour automatique
        // =========================

        existingMessage.setUpdatedAt(
                LocalDateTime.now()
        );


        Message updatedMessage =
                messageRepository.save(
                        existingMessage
                );

        return messageMapper.entityToResponse(
                updatedMessage
        );
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public MessageResponseDto getById(
            UUID messageId
    ) {

        Message message =
                messageRepository.findById(
                                messageId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Message non trouvé avec l'id : "
                                                + messageId
                                )
                        );

        return messageMapper.entityToResponse(
                message
        );
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<MessageResponseDto> getAll() {

        return messageRepository.findAll()
                .stream()
                .map(
                        messageMapper::entityToResponse
                )
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID messageId
    ) {

        if (
                !messageRepository
                        .existsById(
                                messageId
                        )
        ) {

            throw new EntityNotFoundException(
                    "Message non trouvé avec l'id : "
                            + messageId
            );
        }

        messageRepository.deleteById(
                messageId
        );
    }
}