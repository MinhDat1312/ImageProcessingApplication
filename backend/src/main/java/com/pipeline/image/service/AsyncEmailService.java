package com.pipeline.image.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class AsyncEmailService {
    private final JavaMailSender javaMailSender;

    @Async("emailExecutor")
    public void handleSendEmailSync(String recipient, String subject, String content, boolean isMultipart, boolean isHtml)
    {
        MimeMessage mimeMessage = this.javaMailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, isMultipart, StandardCharsets.UTF_8.name());
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText(content, isHtml);

            this.javaMailSender.send(mimeMessage);
        } catch (Exception e) {
            log.error("Lỗi khi gửi mail tới " + recipient + ": " + e.getMessage());
        }
    }
}
