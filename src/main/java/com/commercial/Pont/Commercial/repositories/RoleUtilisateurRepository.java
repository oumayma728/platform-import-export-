package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.models.Role;
import com.commercial.Pont.Commercial.models.RoleUtilisateur;
import com.commercial.Pont.Commercial.models.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleUtilisateurRepository extends JpaRepository<RoleUtilisateur, UUID> {

    boolean existsByUtilisateurAndRole(
            Utilisateur utilisateur,
            Role role
    );

    List<RoleUtilisateur> findByUtilisateurUtilisateurId(
            UUID utilisateurId
    );

    boolean existsByUtilisateurUtilisateurIdAndRoleRoleId(
            UUID utilisateurId,
            UUID roleId
    );


    Optional<RoleUtilisateur> findByUtilisateurUtilisateurIdAndRoleRoleId(
            UUID utilisateurId,
            UUID roleId
    );
}
