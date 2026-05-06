package com.pipeline.image.service;

import com.pipeline.image.entity.User;
import com.pipeline.image.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public User handleGetAccountByEmail(String email) {
        return this.userRepository.findByEmailWithRole(email).orElse(null);
    }
}
