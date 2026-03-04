package com.denimhub.denim_hub.service;

import com.denimhub.denim_hub.entity.Sale;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.text.SimpleDateFormat;

@Service
@Slf4j
public class BillCommunicationService {

    @Value("${twilio.account.sid}")
    private String twilioAccountSid;

    @Value("${twilio.auth.token}")
    private String twilioAuthToken;

    @Value("${twilio.phone.number}")
    private String twilioPhoneNumber;

    private final JavaMailSender mailSender;

    public BillCommunicationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // Send bill via SMS
    public void sendBillViaSMS(String mobile, Sale sale) {
        try {
            Twilio.init(twilioAccountSid, twilioAuthToken);

            String messageBody = String.format(
                    "🧾 Denim Hub Bill\n" +
                            "Bill No: %s\n" +
                            "Date: %s\n" +
                            "Items: %d\n" +
                            "Total: ₹%.2f\n" +
                            "Payment: %s\n" +
                            "Thank you for shopping!",
                    sale.getSaleNo(),
                    new SimpleDateFormat("dd-MM-yyyy HH:mm").format(sale.getBillDate()),
                    sale.getTotalItems(),
                    sale.getTotalAmount(),
                    sale.getPaymentMethod()
            );

            Message message = Message.creator(
                    new PhoneNumber("+91" + mobile), // Indian numbers
                    new PhoneNumber(twilioPhoneNumber),
                    messageBody
            ).create();

            log.info("SMS sent successfully: " + message.getSid());

        } catch (Exception e) {
            log.error("Failed to send SMS: " + e.getMessage());
        }
    }

    // Send bill via Email
    public void sendBillViaEmail(String email, Sale sale) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Your Denim Hub Bill - " + sale.getSaleNo());

            StringBuilder emailBody = new StringBuilder();
            emailBody.append("Dear ").append(sale.getCustomer().getName()).append(",\n\n");
            emailBody.append("Thank you for shopping at Denim Hub!\n\n");
            emailBody.append("📋 BILL DETAILS\n");
            emailBody.append("================\n");
            emailBody.append("Bill No: ").append(sale.getSaleNo()).append("\n");
            emailBody.append("Date: ").append(new SimpleDateFormat("dd-MM-yyyy HH:mm").format(sale.getBillDate())).append("\n\n");
            emailBody.append("Items Purchased:\n");

            for (var item : sale.getItems()) {
                emailBody.append(String.format("  • %s x%d = ₹%.2f\n",
                        item.getProduct().getName(),
                        item.getQuantity(),
                        item.getTotal()));
            }

            emailBody.append("\n");
            emailBody.append(String.format("Subtotal: ₹%.2f\n", sale.getSubtotal()));
            if (sale.getDiscountAmount() != null && sale.getDiscountAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
                emailBody.append(String.format("Discount: -₹%.2f\n", sale.getDiscountAmount()));
            }
            emailBody.append(String.format("TOTAL: ₹%.2f\n", sale.getTotalAmount()));
            emailBody.append("Payment Method: ").append(sale.getPaymentMethod()).append("\n\n");
            emailBody.append("Visit us again!\n");
            emailBody.append("Denim Hub - Your Denim Store");

            message.setText(emailBody.toString());

            mailSender.send(message);
            log.info("Email sent successfully to: " + email);

        } catch (Exception e) {
            log.error("Failed to send email: " + e.getMessage());
        }
    }

    // Send WhatsApp message (using Twilio WhatsApp API)
    public void sendBillViaWhatsApp(String mobile, Sale sale) {
        try {
            Twilio.init(twilioAccountSid, twilioAuthToken);

            String messageBody = String.format(
                    "*Denim Hub Bill* 🧾\n\n" +
                            "Bill No: %s\n" +
                            "Date: %s\n" +
                            "----------------\n" +
                            "Items: %d\n" +
                            "Total: ₹%.2f\n" +
                            "Payment: %s\n" +
                            "----------------\n" +
                            "Thank you for shopping!",
                    sale.getSaleNo(),
                    new SimpleDateFormat("dd-MM-yyyy HH:mm").format(sale.getBillDate()),
                    sale.getTotalItems(),
                    sale.getTotalAmount(),
                    sale.getPaymentMethod()
            );

            Message message = Message.creator(
                    new PhoneNumber("whatsapp:+91" + mobile),
                    new PhoneNumber("whatsapp:" + twilioPhoneNumber),
                    messageBody
            ).create();

            log.info("WhatsApp message sent: " + message.getSid());

        } catch (Exception e) {
            log.error("Failed to send WhatsApp: " + e.getMessage());
        }
    }
}