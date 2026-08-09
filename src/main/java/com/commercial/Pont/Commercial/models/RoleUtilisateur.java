package com.commercial.Pont.Commercial.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleUtilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID roleUtilisateurId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateurId")
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roleId")
    private Role role;


    private LocalDateTime createdAt;
}