package com.pipeline.image.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipeline.image.common.Gender;
import com.pipeline.image.common.Role;
import com.pipeline.image.dto.request.auth.LoginRequest;
import com.pipeline.image.dto.request.auth.RegisterRequest;
import com.pipeline.image.dto.request.auth.VerifyUserRequest;
import com.pipeline.image.dto.response.auth.LoginResponse;
import com.pipeline.image.dto.response.auth.UserResponse;
import com.pipeline.image.entity.User;
import com.pipeline.image.exception.InvalidException;
import com.pipeline.image.repository.RoleRepository;
import com.pipeline.image.repository.UserRepository;
import com.pipeline.image.util.BasicUtil;
import com.pipeline.image.util.FileUploadUtil;
import com.pipeline.image.util.SecurityUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Collections;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    private final EmailService emailService;
    private final StorageService storageService;
    private final RedisService redisService;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    private final AuthenticationManagerBuilder authenticationManagerBuilder;
    private final PasswordEncoder passwordEncoder;
    private final SecurityUtil securityUtil;
    private final ObjectMapper mapper;

    @Value("${minhdat.jwt.access-token-validity-in-seconds}")
    private long jwtAccessToken;
    @Value("${minhdat.jwt.refresh-token-validity-in-seconds}")
    private long jwtRefreshToken;
    @Value("${minhdat.verify-code-validity-in-seconds}")
    private long validityInSeconds;

    public UserResponse handleRegister(RegisterRequest request) throws InvalidException {
        User checkUser = this.userRepository.findByEmailWithRole(request.getEmail()).orElse(null);
        if (checkUser != null) throw new InvalidException("Email đã được đăng ký.");

        String hashPassword = this.passwordEncoder.encode(request.getPassword());
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(hashPassword);
        user.setGender(request.getGender());
        user.setRole(this.roleRepository.findByName(Role.USER.getValue()));
        try {
            MultipartFile multipartFile = BasicUtil.convertToMultipartFile(
                    user.getGender() == Gender.MALE ? FileUploadUtil.AVATAR_MALE : FileUploadUtil.AVATAR_FEMALE
            );
            String avatarUrl = BasicUtil.uploadImage(multipartFile, "avatars", this.storageService);
            user.setAvatar(avatarUrl);
        } catch (IOException | InvalidException e) {
            throw new InvalidException("Lỗi khi upload avatar");
        }
        User savedUser = this.userRepository.save(user);

        String verificationCode = BasicUtil.generateVerificationCode();
        this.redisService.saveWithTTL(
                savedUser.getEmail(),
                verificationCode,
                validityInSeconds,
                TimeUnit.SECONDS
        );
        this.emailService.handleSendVerificationEmail(savedUser.getEmail(), verificationCode);

        return this.convertToUserResponse(savedUser);
    }

    public LoginResponse handleLogin(
            LoginRequest loginRequest, HttpServletResponse response, HttpServletRequest request
    ) throws InvalidException
    {
        User user = this.userRepository.findByEmailWithRole(loginRequest.getEmail())
                .orElseThrow(() -> new InvalidException("Tài khoản không hợp lệ"));
        if (!user.isEnabled()) throw new InvalidException("Tài khoản bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.");

        Authentication authentication = this.authenticationManagerBuilder.getObject()
                .authenticate(new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(), loginRequest.getPassword())
                );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        log.info("Tài khoản đang đăng nhập: {}", user.getEmail());

        LoginResponse loginResponse = this.createLoginResponse(user);

        log.info("Đã đăng nhập: {}", loginResponse.getEmail());

        // Tạo token mới và lưu vào Redis
        String accessToken = this.securityUtil.createAccessToken(user.getEmail(), loginResponse);
        String refreshToken = this.securityUtil.createRefreshToken(user.getEmail(), loginResponse);

        log.info("Refresh Token đã tạo: {}", refreshToken);

        this.redisService.saveWithTTL(
                "user:" + user.getEmail() + ":refresh",
                refreshToken,
                jwtRefreshToken,
                TimeUnit.SECONDS
        );

        ResponseCookie accessCookie = ResponseCookie
                .from("accessToken", accessToken)
                .httpOnly(true)
                .secure(false) // for dev
                .sameSite("Lax") // for dev
                .path("/")
                .maxAge(jwtAccessToken)
                .build();

        ResponseCookie refreshCookie = ResponseCookie
                .from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false) // for dev
                .sameSite("Lax") // for dev
                .path("/")
                .maxAge(jwtRefreshToken)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        return loginResponse;
    }

    public LoginResponse handleRefreshToken(String refreshToken, HttpServletResponse response) throws InvalidException {
        Jwt jwt = this.securityUtil.checkValidToken(refreshToken);
        String email = jwt.getSubject();

        if(refreshToken.equalsIgnoreCase("missingValue")) {
            throw new InvalidException("Không có refresh token ở cookie");
        }
        if (!this.redisService.hasKey("user:" + email + ":refresh")
                || !this.redisService.getValue("user:" + email + ":refresh").equalsIgnoreCase(refreshToken)
        ) {
            throw new InvalidException("Refresh token không hợp lệ");
        }

        User currentUser = this.userRepository.findByEmailWithRole(email).
                orElseThrow(() -> new InvalidException("Tài khoản không hợp lệ"));
        if (!currentUser.isEnabled()) throw new InvalidException("Tài khoản bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.");

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                currentUser.getEmail(),
                currentUser.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        LoginResponse loginResponse = createLoginResponse(currentUser);

        String newAccessToken = this.securityUtil.createAccessToken(email, loginResponse);
        String newRefreshToken = this.securityUtil.createRefreshToken(email, loginResponse);

        this.redisService.replaceKey(
                "user:" + email + ":refresh",
                "user:" + email + ":refresh",
                newRefreshToken,
                jwtRefreshToken,
                TimeUnit.SECONDS
        );

        ResponseCookie newAccessCookie = ResponseCookie
                .from("accessToken", newAccessToken)
                .httpOnly(true)
                .secure(false) // for dev
                .sameSite("Lax") // for dev
                .path("/")
                .maxAge(jwtAccessToken)
                .build();

        ResponseCookie newRefreshCookie = ResponseCookie
                .from("refreshToken", newRefreshToken)
                .httpOnly(true)
                .secure(false) // for dev
                .sameSite("Lax") // for dev
                .path("/")
                .maxAge(jwtRefreshToken)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, newAccessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, newRefreshCookie.toString());

        return loginResponse;
    }

    public void handleLogout(String accessToken, String refreshToken, HttpServletResponse response) {
        Jwt jwt = this.securityUtil.checkValidToken(refreshToken);
        String email = jwt.getSubject();
        if(email == null || email.isEmpty()) return;

        this.redisService.deleteKey("user:" + email + ":refresh");
        this.redisService.saveWithTTL(
                "blacklist:" + accessToken,
                "revoked",
                this.securityUtil.getRemainingTime(accessToken),
                TimeUnit.SECONDS

        );

        ResponseCookie deleteAccessCookie = ResponseCookie.from("accessToken", "")
                .httpOnly(true)
                .secure(false) // for dev
                .sameSite("Lax") // for dev
                .path("/")
                .maxAge(0)
                .build();

        ResponseCookie deleteRefreshCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false) // for dev
                .sameSite("Lax") // for dev
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, deleteAccessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, deleteRefreshCookie.toString());
    }

    public UserResponse handleGetCurrentUser() throws InvalidException {
        String email = SecurityUtil.getCurrentUserEmail();

        User user = this.userRepository.findByEmailWithRole(email)
                .orElseThrow(() -> new InvalidException("Tài khoản không hợp lệ"));

        return this.convertToUserResponse(user);
    }

    public void handleVerifyUser(VerifyUserRequest verifyUser) throws InvalidException {
        User user = this.userRepository.findByEmailWithRole(verifyUser.getEmail())
                .orElseThrow(() -> new InvalidException("Tài khoản không hợp lệ"));

        String key = user.getEmail();
        if(!this.redisService.hasKey(key)) throw new InvalidException("Mã xác thực hết hạn");

        if(!this.redisService.getValue(key).equalsIgnoreCase(verifyUser.getVerificationCode())) {
            throw new InvalidException("Mã xác thực không hợp lệ");
        }

        user.setEnabled(true);
        this.userRepository.save(user);

        this.redisService.deleteKey(key);
    }

    public void handleResendCode(String email) throws InvalidException {
        User user = this.userRepository.findByEmailWithRole(email)
                .orElseThrow(() -> new InvalidException("Tài khoản không hợp lệ"));

        String key = user.getEmail();
        String verificationCode = BasicUtil.generateVerificationCode();
        this.redisService.replaceKey(
                key,
                key,
                verificationCode,
                validityInSeconds,
                TimeUnit.SECONDS
        );
        this.emailService.handleSendVerificationEmail(key, verificationCode);
    }


    private LoginResponse createLoginResponse(User user) {
        LoginResponse loginResponse = new LoginResponse();

        loginResponse.setUserId(user.getUserId());
        loginResponse.setUsername(Objects.requireNonNullElse(user.getUsername(), ""));
        loginResponse.setEmail(user.getEmail());
        loginResponse.setGender(user.getGender());
        loginResponse.setAvatar(Objects.requireNonNullElse(user.getAvatar(), ""));
        loginResponse.setEnabled(user.isEnabled());

        if (user.getRole() != null) {
            loginResponse.setRole(
                    new LoginResponse.RoleUser(user.getRole().getRoleId(), user.getRole().getName())
            );
        }

        return loginResponse;
    }

    private UserResponse convertToUserResponse(User user) {
        UserResponse userResponse = new UserResponse();

        userResponse.setUserId(user.getUserId());
        userResponse.setUsername(Objects.requireNonNullElse(user.getUsername(), ""));
        userResponse.setEmail(user.getEmail());
        userResponse.setGender(user.getGender());
        userResponse.setAvatar(Objects.requireNonNullElse(user.getAvatar(), ""));
        userResponse.setEnabled(user.isEnabled());
        userResponse.setCreatedAt(user.getCreatedAt());
        userResponse.setUpdatedAt(user.getUpdatedAt());

        if (user.getRole() != null) {
            userResponse.setRole(
                    new UserResponse.RoleUser(user.getRole().getRoleId(), user.getRole().getName())
            );
        }

        return userResponse;
    }
}