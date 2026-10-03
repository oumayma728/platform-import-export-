package com.commercial.Pont.Commercial.config;

import com.commercial.Pont.Commercial.enums.AuthProvider;
import com.commercial.Pont.Commercial.enums.FacturationStatus;
import com.commercial.Pont.Commercial.enums.FacturationType;
import com.commercial.Pont.Commercial.enums.ValidationStatus;
import com.commercial.Pont.Commercial.models.*;
import com.commercial.Pont.Commercial.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final FacturationRepository facturationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {

        LocalDateTime now = LocalDateTime.now();

        // =====================================================
        // 1. LOCATIONS - MAROC
        // =====================================================

        Location rabat = createLocation(
                "Rabat",
                "Maroc",
                "10000",
                "Rabat",
                "Rabat-Salé-Kénitra"
        );

        Location agadir = createLocation(
                "Agadir",
                "Maroc",
                "80000",
                "Agadir",
                "Souss-Massa"
        );

        Location casablanca = createLocation(
                "Casablanca",
                "Maroc",
                "20000",
                "Casablanca",
                "Casablanca-Settat"
        );


        // =====================================================
        // 2. LOCATIONS - TUNISIE
        // =====================================================

        Location tunis = createLocation(
                "Tunis",
                "Tunisie",
                "1000",
                "Tunis",
                "Tunis"
        );

        Location ariana = createLocation(
                "Ariana",
                "Tunisie",
                "2080",
                "Ariana",
                "Ariana"
        );

        Location benArous = createLocation(
                "Ben Arous",
                "Tunisie",
                "2013",
                "Ben Arous",
                "Ben Arous"
        );

        Location manouba = createLocation(
                "Manouba",
                "Tunisie",
                "2010",
                "Manouba",
                "Manouba"
        );

        Location nabeul = createLocation(
                "Nabeul",
                "Tunisie",
                "8000",
                "Nabeul",
                "Nabeul"
        );

        Location zaghouan = createLocation(
                "Zaghouan",
                "Tunisie",
                "1100",
                "Zaghouan",
                "Zaghouan"
        );

        Location bizerte = createLocation(
                "Bizerte",
                "Tunisie",
                "7000",
                "Bizerte",
                "Bizerte"
        );

        Location beja = createLocation(
                "Béja",
                "Tunisie",
                "9000",
                "Béja",
                "Béja"
        );

        Location jendouba = createLocation(
                "Jendouba",
                "Tunisie",
                "8100",
                "Jendouba",
                "Jendouba"
        );

        Location kef = createLocation(
                "Le Kef",
                "Tunisie",
                "7100",
                "Le Kef",
                "Le Kef"
        );

        Location siliana = createLocation(
                "Siliana",
                "Tunisie",
                "6100",
                "Siliana",
                "Siliana"
        );

        Location kairouan = createLocation(
                "Kairouan",
                "Tunisie",
                "3100",
                "Kairouan",
                "Kairouan"
        );

        Location kasserine = createLocation(
                "Kasserine",
                "Tunisie",
                "1200",
                "Kasserine",
                "Kasserine"
        );

        Location sidiBouzid = createLocation(
                "Sidi Bouzid",
                "Tunisie",
                "9100",
                "Sidi Bouzid",
                "Sidi Bouzid"
        );

        Location sousse = createLocation(
                "Sousse",
                "Tunisie",
                "4000",
                "Sousse",
                "Sousse"
        );

        Location monastir = createLocation(
                "Monastir",
                "Tunisie",
                "5000",
                "Monastir",
                "Monastir"
        );

        Location mahdia = createLocation(
                "Mahdia",
                "Tunisie",
                "5100",
                "Mahdia",
                "Mahdia"
        );

        Location sfax = createLocation(
                "Sfax",
                "Tunisie",
                "3000",
                "Sfax",
                "Sfax"
        );

        Location gabes = createLocation(
                "Gabès",
                "Tunisie",
                "6000",
                "Gabès",
                "Gabès"
        );

        Location medenine = createLocation(
                "Medenine",
                "Tunisie",
                "4100",
                "Medenine",
                "Medenine"
        );

        Location tataouine = createLocation(
                "Tataouine",
                "Tunisie",
                "3200",
                "Tataouine",
                "Tataouine"
        );

        Location gafsa = createLocation(
                "Gafsa",
                "Tunisie",
                "2100",
                "Gafsa",
                "Gafsa"
        );

        Location tozeur = createLocation(
                "Tozeur",
                "Tunisie",
                "2200",
                "Tozeur",
                "Tozeur"
        );

        Location kebili = createLocation(
                "Kébili",
                "Tunisie",
                "4200",
                "Kébili",
                "Kébili"
        );


        // =====================================================
        // 3. ENTREPRISE
        // =====================================================
        // Une seule entreprise dans les données initiales :
        // 3LM Solutions
        // =====================================================

        Entreprise entreprise =
                entrepriseRepository
                        .findByNom("3LM Solutions")
                        .orElseGet(() ->
                                entrepriseRepository.save(
                                        Entreprise.builder()
                                                .nom("3LM Solutions")
                                                .description(
                                                        "Entreprise spécialisée dans les solutions "
                                                                + "technologiques et commerciales."
                                                )
                                                .secteurActivite("Technologie")
                                                .location(bizerte)
                                                .createdAt(now)
                                                .updatedAt(now)
                                                .build()
                                )
                        );


        // =====================================================
        // 4. INCOTERMS 2020
        // =====================================================
        // Les 11 Incoterms actuellement utilisés dans
        // les Incoterms® 2020.
        // =====================================================

        createIncoterm(
                "EXW",
                "Ex Works",
                "Le vendeur met la marchandise à disposition dans ses locaux. "
                        + "L'acheteur prend en charge les principaux coûts et risques "
                        + "à partir de ce point.",
                now
        );

        createIncoterm(
                "FCA",
                "Free Carrier",
                "Le vendeur remet la marchandise au transporteur ou à une autre "
                        + "personne désignée par l'acheteur au lieu convenu.",
                now
        );

        createIncoterm(
                "CPT",
                "Carriage Paid To",
                "Le vendeur paie le transport jusqu'au lieu de destination convenu, "
                        + "mais le risque est transféré à l'acheteur lors de la remise "
                        + "au transporteur.",
                now
        );

        createIncoterm(
                "CIP",
                "Carriage and Insurance Paid To",
                "Le vendeur paie le transport et souscrit une assurance couvrant "
                        + "la marchandise jusqu'au lieu de destination convenu.",
                now
        );

        createIncoterm(
                "DAP",
                "Delivered At Place",
                "Le vendeur livre la marchandise au lieu de destination convenu, "
                        + "prête à être déchargée.",
                now
        );

        createIncoterm(
                "DPU",
                "Delivered at Place Unloaded",
                "Le vendeur livre et décharge la marchandise au lieu de destination "
                        + "convenu.",
                now
        );

        createIncoterm(
                "DDP",
                "Delivered Duty Paid",
                "Le vendeur prend en charge la livraison, les formalités douanières "
                        + "à l'importation ainsi que les droits et taxes.",
                now
        );

        createIncoterm(
                "FAS",
                "Free Alongside Ship",
                "Le vendeur livre la marchandise le long du navire au port "
                        + "d'embarquement convenu.",
                now
        );

        createIncoterm(
                "FOB",
                "Free On Board",
                "Le vendeur livre la marchandise à bord du navire au port "
                        + "d'embarquement convenu.",
                now
        );

        createIncoterm(
                "CFR",
                "Cost and Freight",
                "Le vendeur paie les coûts et le fret nécessaires pour acheminer "
                        + "la marchandise jusqu'au port de destination.",
                now
        );

        createIncoterm(
                "CIF",
                "Cost, Insurance and Freight",
                "Le vendeur paie les coûts, le fret et l'assurance jusqu'au port "
                        + "de destination convenu.",
                now
        );


        // =====================================================
        // 5. ROLES
        // =====================================================


        Role roleAdmin =
                roleRepository
                        .findByCode("ADMIN")
                        .orElseGet(() ->
                                roleRepository.save(
                                        Role.builder()
                                                .code("ADMIN")
                                                .nom("Administrateur")
                                                .description(
                                                        "Administrateur de la plateforme."
                                                )
                                                .createdAt(now)
                                                .updatedAt(now)
                                                .build()
                                )
                        );

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
        // 6. UTILISATEUR ADMIN
        // =====================================================
        // Login :
        // Email    : admin@3lmsolutions.com
        // Password : admin
        //
        // Entreprise : 3LM Solutions
        // Roles      : IMPORTATEUR + EXPORTATEUR
        // =====================================================

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail("admin@3lmsolutions.com")
                        .orElseGet(() -> {

                            String encodedPassword =
                                    passwordEncoder.encode("admin");

                            Utilisateur nouvelUtilisateur =
                                    utilisateurRepository.save(
                                            Utilisateur.builder()
                                                    .email("admin@3lmsolutions.com")
                                                    .passwordHash(encodedPassword)
                                                    .nom("Admin")
                                                    .prenom("3LM")
                                                    .telephone("0698347865")
                                                    .fonction("Administrateur")
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


                            // =========================================
                            // FACTURATION INITIALE GRATUITE
                            // =========================================

                            Facturation facturationInitiale =
                                    Facturation.builder()
                                            .numeroFacture(
                                                    "FACT-ADMIN-"
                                                            + System.currentTimeMillis()
                                            )
                                            .tva(20)
                                            .statut(FacturationStatus.GRATUIT)
                                            .type(FacturationType.INITIALISATION)
                                            .methodePaiement("GRATUIT")
                                            .prixFacturation(BigDecimal.ZERO)
                                            .createdAt(now)
                                            .updatedAt(now)
                                            .utilisateur(nouvelUtilisateur)
                                            .build();

                            facturationRepository.save(facturationInitiale);

                            return nouvelUtilisateur;
                        });




        if (!roleUtilisateurRepository
                .existsByUtilisateurAndRole(
                        utilisateur,
                        roleAdmin
                )) {

            roleUtilisateurRepository.save(
                    RoleUtilisateur.builder()
                            .utilisateur(utilisateur)
                            .role(roleAdmin)
                            .createdAt(now)
                            .build()
            );
        }


        // =====================================================
        // 9. INFORMATIONS DE DEMARRAGE
        // =====================================================

        System.out.println(
                "=================================================="
        );

        System.out.println(
                "      INITIALISATION DES DONNEES TERMINEE"
        );

        System.out.println(
                "=================================================="
        );

        System.out.println(
                "Entreprise : 3LM Solutions"
        );

        System.out.println(
                "Utilisateur : admin@3lmsolutions.com"
        );

        System.out.println(
                "Mot de passe : admin"
        );

        System.out.println(
                "Roles : Admin + importateur + exportateur"
        );

        System.out.println(
                "Villes tunisiennes : 24"
        );

        System.out.println(
                "Incoterms : 11"
        );

        System.out.println(
                "=================================================="
        );
    }


    // =========================================================
    // METHODE POUR CREER UNE LOCATION
    // =========================================================

    private Location createLocation(
            String ville,
            String pays,
            String codePostal,
            String adresse,
            String region
    ) {

        return locationRepository
                .findByVilleAndPays(ville, pays)
                .orElseGet(() ->
                        locationRepository.save(
                                Location.builder()
                                        .pays(pays)
                                        .ville(ville)
                                        .codePostal(codePostal)
                                        .adresse(adresse)
                                        .region(region)
                                        .build()
                        )
                );
    }


    // =========================================================
    // METHODE POUR CREER UN INCOTERM
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