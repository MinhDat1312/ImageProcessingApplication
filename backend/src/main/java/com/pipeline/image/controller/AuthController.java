package com.pipeline.image.controller;

import com.pipeline.image.dto.request.auth.LoginRequest;
import com.pipeline.image.dto.request.auth.RegisterRequest;
import com.pipeline.image.dto.request.auth.VerifyUserRequest;
import com.pipeline.image.dto.response.auth.LoginResponse;
import com.pipeline.image.dto.response.auth.UserResponse;
import com.pipeline.image.exception.InvalidException;
import com.pipeline.image.service.AuthService;
import com.pipeline.image.util.annotation.ApiMessage;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) throws InvalidException {
        UserResponse result = this.authService.handleRegister(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest loginRequest, HttpServletResponse response, HttpServletRequest request
    ) throws InvalidException
    {
        return ResponseEntity.ok(this.authService.handleLogin(loginRequest, response, request));
    }

    @GetMapping("/refresh")
    @ApiMessage("Refresh account")
    public ResponseEntity<LoginResponse> refresh(
            @CookieValue(name = "refreshToken", defaultValue = "missingValue") String refreshToken,
            HttpServletResponse response
    ) throws InvalidException
    {
        return ResponseEntity.ok(this.authService.handleRefreshToken(refreshToken, response));
    }

    @PostMapping("/logout")
    @ApiMessage("Logout account")
    public ResponseEntity<Void> logout(
            @CookieValue("accessToken") String accessToken, @CookieValue("refreshToken") String refreshToken,
            HttpServletResponse response
    ) {
        this.authService.handleLogout(accessToken, refreshToken, response);
        return ResponseEntity.status(HttpStatus.OK).body(null);
    }

    @GetMapping("/users")
    public ResponseEntity<Object> getCurrentUser() {
        try {
            UserResponse result = this.authService.handleGetCurrentUser();
            return ResponseEntity.status(HttpStatus.OK).body(result);
        } catch (InvalidException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<Object> verifyAccount(@RequestBody VerifyUserRequest verifyUser) {
        try {
            this.authService.handleVerifyUser(verifyUser);
            return ResponseEntity.ok(Map.of("message", "Xác thực tài khoản thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/resend")
    public ResponseEntity<Object> resendVerificationCode(@RequestParam String email) {
        try {
            this.authService.handleResendCode(email);
            return ResponseEntity.ok(Map.of("message", "Đã gửi mã xác thực"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
