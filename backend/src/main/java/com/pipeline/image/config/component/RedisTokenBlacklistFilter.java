package com.pipeline.image.config.component;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

@Component
public class RedisTokenBlacklistFilter extends OncePerRequestFilter {

    private final RedisTemplate<String, Object> redisTemplate;

    public RedisTokenBlacklistFilter(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain
    ) throws ServletException, IOException {

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
                "/api/v1/auth/register/**",
                "/api/v1/auth/verify",
                "/api/v1/auth/resend",

//              Các endpoint về user để người dùng có thể thao tác với thông tin của chính mình, nhưng vẫn cho phép mọi người xem thông tin cơ bản của user khác (không bao gồm thông tin nhạy cảm như email, password, vai trò)
                "/api/v1/users/{id}",
                "/api/v1/users/reset-password",

//              Các endpoint về role để người dùng có thể xem danh sách vai trò và chi tiết vai trò
                "/api/v1/roles/{id}",
                "/api/v1/roles",
        };

        String requestURI = request.getRequestURI();
        if (Arrays.stream(whiteList).anyMatch(requestURI::startsWith)) {
            filterChain.doFilter(request, response);
            return;
        }

        if(request.getCookies() != null) {
            String token = Arrays.stream(request.getCookies())
                    .filter(c -> c.getName().equalsIgnoreCase("accessToken"))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);

            if (token != null && Boolean.TRUE.equals(this.redisTemplate.hasKey("blacklist:" + token))) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Token has been revoked");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}

