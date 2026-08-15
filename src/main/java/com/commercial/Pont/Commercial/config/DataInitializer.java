package com.commercial.Pont.Commercial.config;

import com.commercial.Pont.Commercial.enums.AuthProvider;
import com.commercial.Pont.Commercial.enums.ValidationStatus;
import com.commercial.Pont.Commercial.models.*;
import com.commercial.Pont.Commercial.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final EntrepriseRepository entrepriseRepository;
    private final IncotermRepository incotermRepository;
    private final LocationRepository locationRepository;
    private final RoleRepository roleRepository;
    private final RoleUtilisateurRepository roleUtilisateurRepository;
    private final UtilisateurRepository utilisateurRepository;

    private final PasswordEncoder passwordEncoder;


    @Override
    @Transactional
    public void run(String... args) {

        LocalDateTime now = LocalDateTime.now();


        // =====================================================
        // 1. LOCATIONS
        // =====================================================

        Location rabat =
                locationRepository
                        .findByVilleAndPays("Rabat", "Maroc")
                        .orElseGet(() ->
                                locationRepository.save(
                                        Location.builder()
                                                .pays("Maroc")
                                                .ville("Rabat")
                                                .codePostal("10000")
                                                .adresse("Rabat")
                                                .region("Rabat-Salé-Kénitra")
                                                .build()
                                )
                        );


        Location agadir =
                locationRepository
                        .findByVilleAndPays("Agadir", "Maroc")
                        .orElseGet(() ->
                                locationRepository.save(
                                        Location.builder()
                                                .pays("Maroc")
                                                .ville("Agadir")
                                                .codePostal("80000")
                                                .adresse("Agadir")
                                                .region("Souss-Massa")
                                                .build()
                                )
                        );


        Location casablanca =
                locationRepository
                        .findByVilleAndPays("Casablanca", "Maroc")
                        .orElseGet(() ->
                                locationRepository.save(
                                        Location.builder()
                                                .pays("Maroc")
                                                .ville("Casablanca")
                                                .codePostal("20000")
                                                .adresse("Casablanca")
                                                .region("Casablanca-Settat")
                                                .build()
                                )
                        );


        Location tunis =
                locationRepository
                        .findByVilleAndPays("Tunis", "Tunisie")
                        .orElseGet(() ->
                                locationRepository.save(
                                        Location.builder()
                                                .pays("Tunisie")
                                                .ville("Tunis")
                                                .codePostal("1000")
                                                .adresse("Tunis")
                                                .region("Tunis")
                                                .build()
                                )
                        );


        Location bizert =
                locationRepository
                        .findByVilleAndPays("Bizerte", "Tunisie")
                        .orElseGet(() ->
                                locationRepository.save(
                                        Location.builder()
                                                .pays("Tunisie")
                                                .ville("Bizerte")
                                                .codePostal("7000")
                                                .adresse("Bizerte")
                                                .region("Bizerte")
                                                .build()
                                )
                        );


        // =====================================================
        // 2. ENTREPRISE
        // =====================================================

        Entreprise entreprise =
                entrepriseRepository
                        .findByNom("3 LM Solutions")
                        .orElseGet(() ->
                                entrepriseRepository.save(
                                        Entreprise.builder()
                                                .nom("3 LM Solutions")
                                                .description(
                                                        "Entreprise spécialisée dans les solutions "
                                                                + "technologiques et commerciales."
                                                )
                                                .secteurActivite("Technologie")
                                                .location(bizert)
                                                .createdAt(now)
                                                .updatedAt(now)
                                                .build()
                                )
                        );


        // =====================================================
        // 3. INCOTERMS
        // =====================================================

        createIncoterm(
                "FOB",
                "Free On Board",
                "Le vendeur livre la marchandise à bord du navire.",
                now
        );

        createIncoterm(
                "CIF",
                "Cost, Insurance and Freight",
                "Coût, assurance et fret.",
                now
        );

        createIncoterm(
                "EXW",
                "Ex Works",
                "La marchandise est mise à disposition chez le vendeur.",
                now
        );

        createIncoterm(
                "DAP",
                "Delivered At Place",
                "La marchandise est livrée au lieu convenu.",
                now
        );

        createIncoterm(
                "DDP",
                "Delivered Duty Paid",
                "Livraison avec droits et taxes acquittés.",
                now
        );


        // =====================================================
        // 4. ROLES
        // =====================================================

        Role roleImportateur =
                roleRepository
                        .findByCode("IMPORTATEUR")
                        .orElseGet(() ->
                                roleRepository.save(
                                        Role.builder()
                                                .code("IMPORTATEUR")
                                                .nom("Importateur")
                                                .description(
                                                        "Utilisateur qui importe des produits."
                                                )
                                                .createdAt(now)
                                                .updatedAt(now)
                                                .build()
                                )
                        );


        Role roleExportateur =
                roleRepository
                        .findByCode("EXPORTATEUR")
                        .orElseGet(() ->
                                roleRepository.save(
                                        Role.builder()
                                                .code("EXPORTATEUR")
                                                .nom("Exportateur")
                                                .description(
                                                        "Utilisateur qui exporte des produits."
                                                )
                                                .createdAt(now)
                                                .updatedAt(now)
                                                .build()
                                )
                        );


        // =====================================================
        // 5. UTILISATEUR
        // =====================================================

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(
                                "jabbourjamal27@gmail.com"
                        )
                        .orElseGet(() -> {

                            String encodedPassword =
                                    passwordEncoder.encode(
                                            "jabbour"
                                    );

                            return utilisateurRepository.save(
                                    Utilisateur.builder()
                                            .email(
                                                    "jabbourjamal27@gmail.com"
                                            )
                                            .passwordHash(
                                                    encodedPassword
                                            )
                                            .nom("Jabbour")
                                            .prenom("Jamal")
                                            .telephone("0607781703")
                                            .fonction("Développeur")
                                            .validationStatus(
                                                    ValidationStatus.VALIDE
                                            )
                                            .nombreChatsUtilises(0)
                                            .maxMessagesPossible(50)
                                            .entreprise(entreprise)
                                            .createdAt(now)
                                            .updatedAt(now)
                                            .authProvider(
                                                    AuthProvider.LOCAL
                                            )
                                            .build()
                            );
                        });


        // =====================================================
        // 6. ROLE UTILISATEUR
        // =====================================================

        if (!roleUtilisateurRepository
                .existsByUtilisateurAndRole(
                        utilisateur,
                        roleImportateur
                )) {

            roleUtilisateurRepository.save(
                    RoleUtilisateur.builder()
                            .utilisateur(utilisateur)
                            .role(roleImportateur)
                            .createdAt(now)
                            .build()
            );
        }


        // =====================================================
        // FIN
        // =====================================================

        System.out.println(
                "=============================================="
        );

        System.out.println(
                "Initialisation des données terminée."
        );

        System.out.println(
                "=============================================="
        );
    }


    // =========================================================
    // MÉTHODE POUR CRÉER UN INCOTERM S'IL N'EXISTE PAS
    // =========================================================

    private void createIncoterm(
            String code,
            String nom,
            String description,
            LocalDateTime now
    ) {

        if (incotermRepository
                .findByCode(code)
                .isEmpty()) {

            incotermRepository.save(
                    Incoterm.builder()
                            .code(code)
                            .nom(nom)
                            .description(description)
                            .createdAt(now)
                            .updatedAt(now)
                            .build()
            );
        }
    }
}
