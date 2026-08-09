package com.commercial.Pont.Commercial.services.ImplementationServices;

import com.commercial.Pont.Commercial.dtos.requestDtos.UpdateProfileRequestDto;
import com.commercial.Pont.Commercial.dtos.requestDtos.UtilisateurRequestDto;
import com.commercial.Pont.Commercial.dtos.responseDtos.UtilisateurResponseDto;
import com.commercial.Pont.Commercial.enums.AuthProvider;
import com.commercial.Pont.Commercial.enums.ValidationStatus;
import com.commercial.Pont.Commercial.mappers.InterfaceMappers.UtilisateurMapperInterface;
import com.commercial.Pont.Commercial.models.Entreprise;
import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.EntrepriseRepository;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import com.commercial.Pont.Commercial.services.ServiceInterfaces.UtilisateurServiceInterface;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UtilisateurServiceImpl
        implements UtilisateurServiceInterface {

    private final UtilisateurRepository utilisateurRepository;

    private final UtilisateurMapperInterface utilisateurMapper;

    private final EntrepriseRepository entrepriseRepository;

    private final PasswordEncoder passwordEncoder;

    // =========================
    // CREATE
    // =========================

    @Override
    public UtilisateurResponseDto create(
            UtilisateurRequestDto utilisateurRequestDto
    ) {

        // =========================
        // Vérification de l'email
        // =========================

        if (utilisateurRepository.existsByEmail(
                utilisateurRequestDto.getEmail()
        )) {

            throw new IllegalArgumentException(
                    "Un utilisateur existe déjà avec l'email : "
                            + utilisateurRequestDto.getEmail()
            );
        }


        // =========================
        // Conversion DTO -> Entity
        // =========================

        Utilisateur utilisateur =
                utilisateurMapper.requestToEntity(
                        utilisateurRequestDto
                );


        // =========================
        // Recherche de l'entreprise
        // =========================

        Entreprise entreprise =
                entrepriseRepository.findById(
                                utilisateurRequestDto.getEntrepriseId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Entreprise non trouvée avec l'id : "
                                                + utilisateurRequestDto.getEntrepriseId()
                                )
                        );


        // =========================
        // Association avec entreprise
        // =========================

        utilisateur.setEntreprise(
                entreprise
        );


        // =========================
        // Hashage du mot de passe
        // =========================

        utilisateur.setPasswordHash(
                passwordEncoder.encode(
                        utilisateurRequestDto.getPassword()
                )
        );


        // =========================
        // Valeurs par défaut
        // =========================

        utilisateur.setValidationStatus(
                ValidationStatus.EN_ATTENTE_VALIDATION
        );

        utilisateur.setNombreChatsUtilises(
                0
        );

        utilisateur.setMaxMessagesPossible(
                50
        );


        // =========================
        // Gestion des dates
        // =========================

        LocalDateTime now = LocalDateTime.now();

        utilisateur.setCreatedAt(
                now
        );

        utilisateur.setUpdatedAt(
                now
        );
        utilisateur.setAuthProvider(
                AuthProvider.LOCAL
        );


        // =========================
        // Sauvegarde
        // =========================

        Utilisateur savedUtilisateur =
                utilisateurRepository.save(
                        utilisateur
                );


        // =========================
        // Conversion Entity -> Response DTO
        // =========================

        return utilisateurMapper.entityToResponse(
                savedUtilisateur
        );
    }


    // =========================
    // UPDATE
    // =========================

    @Override
    public UtilisateurResponseDto update(
            UUID utilisateurId,
            UtilisateurRequestDto utilisateurRequestDto
    ) {

        // =========================
        // Recherche de l'utilisateur
        // =========================

        Utilisateur existingUtilisateur =
                utilisateurRepository.findById(
                                utilisateurId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur non trouvé avec l'id : "
                                                + utilisateurId
                                )
                        );


        // =========================
        // Mise à jour des informations
        // =========================

        existingUtilisateur.setEmail(
                utilisateurRequestDto.getEmail()
        );

        existingUtilisateur.setPasswordHash(
                utilisateurRequestDto.getPassword()
        );

        existingUtilisateur.setNom(
                utilisateurRequestDto.getNom()
        );

        existingUtilisateur.setPrenom(
                utilisateurRequestDto.getPrenom()
        );

        existingUtilisateur.setTelephone(
                utilisateurRequestDto.getTelephone()
        );

        existingUtilisateur.setFonction(
                utilisateurRequestDto.getFonction()
        );

        existingUtilisateur.setPhotoProfile(
                utilisateurRequestDto
                        .getPhotoProfile()
        );


        // =========================
        // Mise à jour de l'entreprise
        // =========================

        if (
                utilisateurRequestDto.getEntrepriseId() != null
                        &&
                        (
                                existingUtilisateur.getEntreprise() == null
                                        ||
                                        !utilisateurRequestDto
                                                .getEntrepriseId()
                                                .equals(
                                                        existingUtilisateur
                                                                .getEntreprise()
                                                                .getEntrepriseId()
                                                )
                        )
        ) {

            Entreprise entreprise =
                    entrepriseRepository.findById(
                                    utilisateurRequestDto
                                            .getEntrepriseId()
                            )
                            .orElseThrow(() ->
                                    new EntityNotFoundException(
                                            "Entreprise non trouvée avec l'id : "
                                                    + utilisateurRequestDto
                                                    .getEntrepriseId()
                                    )
                            );

            existingUtilisateur.setEntreprise(
                    entreprise
            );
        }


        // =========================
        // Mise à jour automatique
        // =========================

        existingUtilisateur.setUpdatedAt(
                LocalDateTime.now()
        );


        // =========================
        // Sauvegarde
        // =========================

        Utilisateur updatedUtilisateur =
                utilisateurRepository.save(
                        existingUtilisateur
                );

        return utilisateurMapper.entityToResponse(
                updatedUtilisateur
        );
    }


    // =========================
    // GET BY ID
    // =========================

    @Override
    @Transactional(readOnly = true)
    public UtilisateurResponseDto getById(
            UUID utilisateurId
    ) {

        Utilisateur utilisateur =
                utilisateurRepository.findById(
                                utilisateurId
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur non trouvé avec l'id : "
                                                + utilisateurId
                                )
                        );

        return utilisateurMapper.entityToResponse(
                utilisateur
        );
    }


    // =========================
    // GET ALL
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<UtilisateurResponseDto> getAll() {

        return utilisateurRepository.findAll()
                .stream()
                .map(
                        utilisateurMapper::entityToResponse
                )
                .toList();
    }


    // =========================
    // DELETE
    // =========================

    @Override
    public void delete(
            UUID utilisateurId
    ) {

        if (
                !utilisateurRepository
                        .existsById(
                                utilisateurId
                        )
        ) {

            throw new EntityNotFoundException(
                    "Utilisateur non trouvé avec l'id : "
                            + utilisateurId
            );
        }

        utilisateurRepository.deleteById(
                utilisateurId
        );
    }



    private UtilisateurResponseDto changerValidationStatus(
            UUID utilisateurId,
            ValidationStatus validationStatus
    ) {

        Utilisateur utilisateur =
                utilisateurRepository.findById(utilisateurId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur non trouvé avec l'id : "
                                                + utilisateurId
                                )
                        );

        utilisateur.setValidationStatus(
                validationStatus
        );

        utilisateur.setUpdatedAt(
                LocalDateTime.now()
        );

        Utilisateur savedUtilisateur =
                utilisateurRepository.save(
                        utilisateur
                );

        return utilisateurMapper.entityToResponse(
                savedUtilisateur
        );
    }






    @Override
    public UtilisateurResponseDto validerUtilisateur(
            UUID utilisateurId
    ) {
        return changerValidationStatus(
                utilisateurId,
                ValidationStatus.VALIDE
        );
    }

    @Override
    public UtilisateurResponseDto rejeterUtilisateur(
            UUID utilisateurId
    ) {
        return changerValidationStatus(
                utilisateurId,
                ValidationStatus.REJETE
        );
    }

    @Override
    public UtilisateurResponseDto suspendreUtilisateur(
            UUID utilisateurId
    ) {
        return changerValidationStatus(
                utilisateurId,
                ValidationStatus.SUSPENDU
        );
    }



    @Override
    public UtilisateurResponseDto getByEmail(String email) {

        Utilisateur utilisateur =
                utilisateurRepository.findByEmail(email)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur non trouvé avec l'email : "
                                                + email
                                )
                        );

        return utilisateurMapper.entityToResponse(
                utilisateur
        );
    }




    @Override
    @Transactional
    public UtilisateurResponseDto updateProfile(
            String currentEmail,
            UpdateProfileRequestDto request
    ) {

        Utilisateur utilisateur =
                utilisateurRepository.findByEmail(currentEmail)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Utilisateur non trouvé"
                                )
                        );

        // Vérification du nouvel email
        if (!currentEmail.equals(request.getEmail())
                && utilisateurRepository.existsByEmail(
                request.getEmail()
        )) {

            throw new IllegalArgumentException(
                    "Cet email est déjà utilisé"
            );
        }

        utilisateur.setNom(request.getNom());
        utilisateur.setPrenom(request.getPrenom());
        utilisateur.setEmail(request.getEmail());
        utilisateur.setTelephone(request.getTelephone());
        utilisateur.setFonction(request.getFonction());

        Utilisateur updatedUtilisateur =
                utilisateurRepository.save(utilisateur);

        return utilisateurMapper.entityToResponse(
                updatedUtilisateur
        );
    }

}