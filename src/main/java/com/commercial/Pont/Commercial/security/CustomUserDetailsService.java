package com.commercial.Pont.Commercial.security;

import com.commercial.Pont.Commercial.models.Utilisateur;
import com.commercial.Pont.Commercial.repositories.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService
        implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        Utilisateur utilisateur =
                utilisateurRepository.findByEmail(email)
                        .orElseThrow(() ->
                                new UsernameNotFoundException(
                                        "Utilisateur non trouvé"
                                )
                        );
        utilisateur.getRoles().forEach(
                roleUtilisateur ->
                        roleUtilisateur.getRole().getCode()
        );

        return new CustomUserDetails(utilisateur);
    }
}