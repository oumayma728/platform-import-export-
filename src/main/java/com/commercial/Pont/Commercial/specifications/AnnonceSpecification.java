package com.commercial.Pont.Commercial.specifications;

import com.commercial.Pont.Commercial.models.Annonce;
import org.springframework.data.jpa.domain.Specification;

public class AnnonceSpecification {

    public static Specification<Annonce> hasPays(String pays) {

        return (root, query, cb) ->

                pays == null || pays.isBlank()

                        ? null

                        : cb.equal(
                        cb.lower(
                                root.get("locationOrigine")
                                        .get("pays")
                        ),
                        pays.toLowerCase()
                );
    }

    public static Specification<Annonce> hasCategorie(String categorie) {

        return (root, query, cb) ->

                categorie == null || categorie.isBlank()

                        ? null

                        : cb.equal(
                        cb.lower(
                                root.get("categorie")
                                        .get("nom")
                        ),
                        categorie.toLowerCase()
                );
    }

    public static Specification<Annonce> hasCertification(
            String certification
    ) {

        return (root, query, cb) ->

                certification == null || certification.isBlank()

                        ? null

                        : cb.like(
                        cb.lower(root.get("certification")),
                        "%" + certification.toLowerCase() + "%"
                );
    }

    public static Specification<Annonce> prixMin(
            Double prixMin
    ) {

        return (root, query, cb) ->

                prixMin == null

                        ? null

                        : cb.greaterThanOrEqualTo(
                        root.get("prix"),
                        prixMin
                );
    }

    public static Specification<Annonce> prixMax(
            Double prixMax
    ) {

        return (root, query, cb) ->

                prixMax == null

                        ? null

                        : cb.lessThanOrEqualTo(
                        root.get("prix"),
                        prixMax
                );
    }

}