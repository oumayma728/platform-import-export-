package com.commercial.Pont.Commercial.repositories;

import com.commercial.Pont.Commercial.enums.AnnouncementType;
import com.commercial.Pont.Commercial.models.Annonce;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnnonceRepository extends JpaRepository<Annonce, UUID>, JpaSpecificationExecutor<Annonce> {

    List<Annonce> findByUtilisateurUtilisateurId(
            UUID utilisateurId
    );

    List<Annonce> findByType(
            AnnouncementType type
    );


    List<Annonce> findByUtilisateurUtilisateurIdAndType(
            UUID utilisateurId,
            AnnouncementType type
    );
}

