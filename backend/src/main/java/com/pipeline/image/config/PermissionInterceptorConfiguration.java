package com.pipeline.image.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class PermissionInterceptorConfiguration implements WebMvcConfigurer {

    @Bean
    PermissionInterceptor getPermissionInterceptor() {
        return new PermissionInterceptor();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        String[] whiteList = {
//              Các endpoint về tài nguyên tĩnh như swagger có thể public
                "/storage/**",
                "/v3/api-docs/**",
                "/swagger-ui/**",
                "/swagger-ui.html",

//              Endpoint kiểm tra trạng thái server
                "/",
                "/ping",
                "/clear-cookies",
                "/uuid",

//              Ai cũng có thể dùng chat
                "/api/v1/ai/**",

//              Các endpoint xác thực phải public
                "/api/v1/auth/**",

//              Các endpoint về file để người dùng có thể tải lên hoặc tải xuống file
                "/api/v1/files/**",

//              Các endpoint về user để người dùng có thể thao tác với thông tin của chính mình, nhưng vẫn cho phép mọi người xem thông tin cơ bản của user khác (không bao gồm thông tin nhạy cảm như email, password, vai trò)
                "/api/v1/users/{id}",
                "/api/v1/users/me/**",
                "/api/v1/users/update-password",
                "/api/v1/users/reset-password",

//              Các endpoint về role để người dùng có thể xem danh sách vai trò và chi tiết vai trò
                "/api/v1/roles/{id}",
                "/api/v1/roles",

//               Các endpoint về admin được xử lý trong Security
                "/api/v1/admin/**",
        };

        registry.addInterceptor(getPermissionInterceptor())
                .excludePathPatterns(whiteList);
    }
}
