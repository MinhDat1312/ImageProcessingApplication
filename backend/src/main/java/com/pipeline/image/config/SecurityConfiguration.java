package com.pipeline.image.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.util.Base64;
import com.pipeline.image.config.component.AuthenticationEntryPointCustom;
import com.pipeline.image.config.component.RedisTokenBlacklistFilter;
import com.pipeline.image.util.SecurityUtil;
import jakarta.servlet.http.Cookie;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationFilter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.access.BearerTokenAccessDeniedHandler;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity(securedEnabled = true)
@RequiredArgsConstructor
public class SecurityConfiguration {

    @Value("${minhdat.jwt.base64-secret}")
    private String jwtKey;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret<>(getSecretKey()));
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder
                .withSecretKey(getSecretKey())
                .macAlgorithm(SecurityUtil.JWT_ALGORITHM)
                .build();
    }

    private final CorzConfiguration corzConfiguration;

    private SecretKey getSecretKey() {
        byte[] keyBytes = Base64.from(jwtKey).decode();
        return new SecretKeySpec(keyBytes, 0, keyBytes.length, SecurityUtil.JWT_ALGORITHM.getName());
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            String role = jwt.getClaimAsString("role");
            if (role == null) return List.of();

            return List.of(new SimpleGrantedAuthority("ROLE_" + role));
        });

        return converter;
    }

    @Bean
    public BearerTokenResolver bearerTokenResolver() {
        return request -> {
            if (request.getCookies() != null) {
                return Arrays.stream(request.getCookies())
                        .filter(cookie -> "accessToken".equals(cookie.getName()))
                        .map(Cookie::getValue)
                        .findFirst()
                        .orElse(null);
            }

            return null;
        };
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http, AuthenticationEntryPointCustom authenticationEntryPointCustom,
            RedisTokenBlacklistFilter redisTokenBlacklistFilter
    ) throws Exception {
        String[] whiteList = {
//              Các endpoint về tài nguyên tĩnh như swagger có thể public
                "/storage/**",
                "/v3/api-docs/**",
                "/swagger-ui/**",
                "/swagger-ui.html",

//              Các endpoint kiểm tra sức khỏe của server có thể public để các công cụ giám sát có thể truy cập mà không cần xác thực
                "/actuator",
                "/actuator/health",
                "/actuator/health/**",

//              Endpoint kiểm tra trạng thái server
                "/",
                "/ping",
                "/clear-cookies",
                "/uuid",

//              Ai cũng có thể dùng chat
                "/api/v1/ai/**",

//              Các endpoint về auth để người dùng có thể đăng nhập, đăng ký, làm mới token mà không cần phải xác thực trước
                "/api/v1/auth/login",
                "/api/v1/auth/refresh",
                "/api/v1/auth/register",
                "/api/v1/auth/verify",
                "/api/v1/auth/resend",

//              Các endpoint về user để người dùng có thể thao tác với thông tin của chính mình, nhưng vẫn cho phép mọi người xem thông tin cơ bản của user khác (không bao gồm thông tin nhạy cảm như email, password, vai trò)
                "/api/v1/users/{id}",
                "/api/v1/users/reset-password",

//              Các endpoint về role để người dùng có thể xem danh sách vai trò và chi tiết vai trò
                "/api/v1/roles/{id}",
                "/api/v1/roles",
        };


        http
                .csrf(c -> c.disable())
                .cors(cors -> cors.configurationSource(this.corzConfiguration.corsConfigurationSource()))
                .authorizeHttpRequests( request ->
                        request
                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                .requestMatchers(HttpMethod.POST, "/api/v1/roles").hasRole("ADMIN")
                                .requestMatchers(HttpMethod.PUT, "/api/v1/roles").hasRole("ADMIN")
                                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                                .requestMatchers(whiteList).permitAll()
                                .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 ->
                        oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                                .bearerTokenResolver(bearerTokenResolver())
                                .authenticationEntryPoint(authenticationEntryPointCustom)
                )
                .addFilterBefore(redisTokenBlacklistFilter, BearerTokenAuthenticationFilter.class)
                .exceptionHandling(e ->
                        e.authenticationEntryPoint(new BearerTokenAuthenticationEntryPoint())
                                .accessDeniedHandler(new BearerTokenAccessDeniedHandler())
                )
                .formLogin(f -> f.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );

        return http.build();
    }
}
