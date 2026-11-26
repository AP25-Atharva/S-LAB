package com.institute.traininginstituteapi.security;

import com.institute.traininginstituteapi.entity.AppUser;
import com.institute.traininginstituteapi.repository.AppUserRepository;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

/**
 * Turns a verified token into the logged-in user. The role comes from the database on every request,
 * so deactivating a user, changing their role or resetting their password takes effect immediately.
 */
@Component
public class UserJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final AppUserRepository users;

    public UserJwtAuthenticationConverter(AppUserRepository users) {
        this.users = users;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Long userId = CurrentUser.id(jwt);
        if (userId == null) throw new BadCredentialsException("Invalid token");

        AppUser user = users.findById(userId).orElseThrow(() -> new DisabledException("Account no longer exists"));
        if (!user.isActive()) throw new DisabledException("Account is disabled");

        Instant passwordChanged = user.getPasswordChangedAt().atZone(ZoneId.systemDefault()).toInstant();
        if (jwt.getIssuedAt() == null || jwt.getIssuedAt().isBefore(passwordChanged)) {
            throw new CredentialsExpiredException("Password was changed");
        }
        return new JwtAuthenticationToken(jwt, List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole())),
                user.getUsername());
    }
}
