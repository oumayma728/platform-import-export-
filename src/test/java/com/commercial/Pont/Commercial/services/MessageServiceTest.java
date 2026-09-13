package com.commercial.Pont.Commercial.services;

import com.commercial.Pont.Commercial.dtos.requestDtos.CreateMessageRequestDto;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.MessageMapperInterface;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.*;
import com.commercial.Pont.Commercial.services.ImplementationServices.FacturationServiceImpl;
import com.commercial.Pont.Commercial.services.ImplementationServices.MessageServiceImpl;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.NotificationServiceInterface;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private MessageMapperInterface messageMapper;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private FacturationRepository facturationRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private FacturationServiceImpl facturationService;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private NotificationServiceInterface notificationService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private MessageServiceImpl messageService;


    @Test
    void test_chat_counter_limit() {

        // ======================================================
        // ARRANGE
        // ======================================================

        String email = "user@test.com";

        UUID utilisateurId =
                UUID.randomUUID();


        Utilisateur utilisateur =
                Utilisateur.builder()
                        .utilisateurId(utilisateurId)
                        .email(email)
                        .nombreChatsUtilises(50)
                        .maxMessagesPossible(50)
                        .build();


        CreateMessageRequestDto request =
                new CreateMessageRequestDto();


        when(
                authentication.getName()
        ).thenReturn(
                email
        );


        when(
                utilisateurRepository.findByEmail(email)
        ).thenReturn(
                Optional.of(utilisateur)
        );


        // Aucun abonnement actif
        when(
                subscriptionRepository
                        .findFirstByUtilisateurOrderByDateFinDesc(
                                utilisateur
                        )
        ).thenReturn(
                Optional.empty()
        );


        // ======================================================
        // ACT + ASSERT
        // ======================================================

        IllegalStateException exception =
                assertThrows(
                        IllegalStateException.class,
                        () ->
                                messageService.createMyMessage(
                                        request,
                                        authentication
                                )
                );


        assertEquals(
                "Vous avez atteint votre limite de messages.",
                exception.getMessage()
        );


        // ======================================================
        // VERIFY
        // ======================================================

        verify(
                utilisateurRepository,
                times(1)
        ).findByEmail(
                email
        );


        verify(
                subscriptionRepository,
                times(1)
        ).findFirstByUtilisateurOrderByDateFinDesc(
                utilisateur
        );


        verify(
                facturationService,
                times(1)
        ).mettreFacturationLimiteAtteinte(
                utilisateur
        );


        verify(
                notificationService,
                times(1)
        ).notifierQuotaAtteint(
                utilisateur
        );


        // Le message ne doit jamais être créé
        verifyNoInteractions(
                messageRepository
        );


        // La conversation ne doit même pas être recherchée
        verifyNoInteractions(
                conversationRepository
        );


        // Le compteur reste à 50
        assertEquals(
                50,
                utilisateur.getNombreChatsUtilises()
        );


        assertEquals(
                50,
                utilisateur.getMaxMessagesPossible()
        );
    }
}