package com.pipeline.image.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final SpringTemplateEngine templateEngine;
    private final AsyncEmailService asyncEmailService;

    public void handleSendVerificationEmail(String email, String verificationCode) {
        String subject = "Xác thực tài khoản";
        Context context = new Context();
        context.setVariable("verificationCode", verificationCode);
        String content = this.templateEngine.process("verification", context);

        this.asyncEmailService.handleSendEmailSync(email, subject, content, false, true);
    }
}
