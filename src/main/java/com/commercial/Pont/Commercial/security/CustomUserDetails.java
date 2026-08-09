package com.commercial.Pont.Commercial.security;

import com.commercial.Pont.Commercial.models.RoleUtilisateur;
import com.commercial.Pont.Commercial.models.Utilisateur;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

public class CustomUserDetails implements UserDetails {

    private final Utilisateur utilisateur;

    public CustomUserDetails(Utilisateur utilisateur) {
        this.utilisateur = utilisateur;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {

        return utilisateur.getRoles()
                .stream()
                .map(RoleUtilisateur::getRole)
                .map(role ->
                        new SimpleGrantedAuthority(
                                "ROLE_" + role.getCode()
                        )
                )
                .toList();
    }

    @Override
    public String getPassword() {
        return utilisateur.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return utilisateur.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return utilisateur.getValidationStatus() !=
                com.commercial.Pont.Commercial.enums.ValidationStatus.SUSPENDU;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}