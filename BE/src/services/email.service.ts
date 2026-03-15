import { google } from 'googleapis';
import { buildFrontendUrl } from '../utils/frontendUrl';

interface MailPayload {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
}

export class EmailService {
  private isResendConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
  }

  private isGmailApiConfigured(): boolean {
    return Boolean(
      process.env.GMAIL_API_CLIENT_ID &&
      process.env.GMAIL_API_CLIENT_SECRET &&
      process.env.GMAIL_API_REFRESH_TOKEN
    );
  }

  private getLogMailTarget(to: string | string[]): string {
    return Array.isArray(to) ? to.join(', ') : to;
  }

  private async sendViaResendApi(to: string, subject: string, html: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
      throw new Error('Resend is not configured');
    }

    const timeoutMs = parseInt(process.env.EMAIL_HTTP_TIMEOUT || '15000');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[EMAIL][RESEND][SEND] to=${to} subject="${subject}"`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Resend API error (${response.status}): ${body}`);
      }

      console.log(`[EMAIL][RESEND][SUCCESS] to=${to} subject="${subject}"`);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async sendViaGmailApi(to: string, subject: string, html: string): Promise<void> {
    const clientId = process.env.GMAIL_API_CLIENT_ID;
    const clientSecret = process.env.GMAIL_API_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_API_REFRESH_TOKEN;
    const redirectUri = process.env.GMAIL_API_REDIRECT_URI || 'https://developers.google.com/oauthplayground';
    const from = process.env.GMAIL_API_SENDER || process.env.EMAIL_USER;

    if (!clientId || !clientSecret || !refreshToken || !from) {
      throw new Error('Gmail API is not configured');
    }

    const timeoutMs = parseInt(process.env.EMAIL_HTTP_TIMEOUT || '15000');

    console.log(`[EMAIL][GMAIL_API][SEND] to=${to} subject="${subject}"`);

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const mimeMessage = [
      `From: Organic Produce Distribution <${from}>`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      html,
    ].join('\r\n');

    const raw = Buffer.from(mimeMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');

    await Promise.race([
      gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Gmail API timeout')), timeoutMs);
      }),
    ]);

    console.log(`[EMAIL][GMAIL_API][SUCCESS] to=${to} subject="${subject}"`);
  }

  private getDefaultSenderEmail(): string {
    return process.env.GMAIL_API_SENDER || process.env.EMAIL_USER || '';
  }

  private async sendViaApiProviders(
    mailOptions: MailPayload,
    logLabel: string,
    preferredProvider: string = 'gmail_api'
  ): Promise<void> {
    const to = this.getLogMailTarget(mailOptions.to);
    const subject = mailOptions.subject;
    const html = mailOptions.html;
    const normalizedProvider = preferredProvider.toLowerCase();
    const useGmailApiFirst = normalizedProvider !== 'resend' && this.isGmailApiConfigured();
    const useResendFirst = normalizedProvider === 'resend' && this.isResendConfigured();
    const allowGmailApiFallback = process.env.EMAIL_ENABLE_GMAIL_API_FALLBACK !== 'false';
    const allowResendFallback = process.env.EMAIL_ENABLE_RESEND_FALLBACK !== 'false';

    console.log(
      `[EMAIL][API][ROUTING] type=${logLabel} provider=${normalizedProvider} gmailApiConfigured=${this.isGmailApiConfigured()} resendConfigured=${this.isResendConfigured()} gmailApiFallback=${allowGmailApiFallback} resendFallback=${allowResendFallback}`
    );

    if (useGmailApiFirst) {
      try {
        await this.sendViaGmailApi(to, subject, html);
        console.log(`✅ ${logLabel} sent to ${to} via Gmail API`);
        return;
      } catch (error) {
        console.error(`❌ Gmail API failed for ${logLabel}, trying other API providers:`, error);
      }
    }

    if (useResendFirst) {
      try {
        await this.sendViaResendApi(to, subject, html);
        console.log(`✅ ${logLabel} sent to ${to} via Resend API`);
        return;
      } catch (error) {
        console.error(`❌ Resend API failed for ${logLabel}, trying other API providers:`, error);
      }
    }

    if (allowGmailApiFallback && this.isGmailApiConfigured() && !useGmailApiFirst) {
      try {
        console.warn(`[EMAIL][API][FALLBACK] Trying Gmail API fallback for ${logLabel}`);
        await this.sendViaGmailApi(to, subject, html);
        console.log(`✅ ${logLabel} sent to ${to} via Gmail API fallback`);
        return;
      } catch (error) {
        console.error(`❌ Gmail API fallback failed for ${logLabel}:`, error);
      }
    }

    if (allowResendFallback && this.isResendConfigured() && !useResendFirst) {
      try {
        console.warn(`[EMAIL][API][FALLBACK] Trying Resend fallback for ${logLabel}`);
        await this.sendViaResendApi(to, subject, html);
        console.log(`✅ ${logLabel} sent to ${to} via Resend fallback`);
        return;
      } catch (error) {
        console.error(`❌ Resend fallback failed for ${logLabel}:`, error);
      }
    }

    throw new Error(`Failed to send ${logLabel}: no API email provider succeeded`);
  }

  async sendVerificationEmail(to: string, token: string, name: string): Promise<void> {
    const verificationUrl = buildFrontendUrl(`/verify-email?token=${encodeURIComponent(token)}`);

    const mailOptions = {
      from: `"Organic Produce Distribution" <${this.getDefaultSenderEmail()}>`,
      to,
      subject: 'Xác nhận địa chỉ email của bạn',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Chào mừng đến với Organic Produce!</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${name}</strong>,</p>
              <p>Cảm ơn bạn đã đăng ký tài khoản tại Organic Produce Distribution. Vui lòng xác nhận địa chỉ email của bạn bằng cách nhấp vào nút bên dưới:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Xác nhận Email</a>
              </div>
              <p>Hoặc sao chép và dán liên kết sau vào trình duyệt của bạn:</p>
              <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
              <p><strong>Lưu ý:</strong> Link xác nhận này sẽ hết hạn sau 24 giờ.</p>
              <p>Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.</p>
            </div>
            <div class="footer">
              <p>© 2026 Organic Produce Distribution. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.sendViaApiProviders(mailOptions, 'verification email', process.env.EMAIL_PROVIDER || 'gmail_api');
      console.log(`✅ Verification email sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const mailOptions = {
      from: `"Organic Produce Distribution" <${this.getDefaultSenderEmail()}>`,
      to,
      subject: 'Chào mừng bạn đến với Organic Produce!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Chào mừng ${name}!</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${name}</strong>,</p>
              <p>Email của bạn đã được xác nhận thành công! Cảm ơn bạn đã tham gia cộng đồng Organic Produce Distribution.</p>
              <p>Bây giờ bạn có thể:</p>
              <ul>
                <li>Duyệt qua các sản phẩm hữu cơ tươi ngon</li>
                <li>Đặt hàng và giao hàng tận nơi</li>
                <li>Theo dõi đơn hàng của bạn</li>
                <li>Kết nối với các nông trại địa phương</li>
              </ul>
              <p>Chúc bạn có trải nghiệm mua sắm tuyệt vời!</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.sendViaApiProviders(mailOptions, 'welcome email', process.env.EMAIL_PROVIDER || 'gmail_api');
      console.log(`✅ Welcome email sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
    }
  }

  async sendPasswordResetEmail(to: string, token: string, name: string): Promise<void> {
    const resetUrl = buildFrontendUrl(`/reset-password?token=${encodeURIComponent(token)}`);
    const subject = 'Đặt lại mật khẩu của bạn';

    const mailOptions = {
      from: `"Organic Produce Distribution" <${this.getDefaultSenderEmail()}>`,
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Đặt lại mật khẩu</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${name}</strong>,</p>
              <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
              </div>
              <p>Hoặc sao chép và dán liên kết sau vào trình duyệt của bạn:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <div class="warning">
                <p style="margin: 0;"><strong>⚠️ Lưu ý quan trọng:</strong></p>
                <ul style="margin: 10px 0;">
                  <li>Link này sẽ hết hạn sau <strong>1 giờ</strong></li>
                  <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                  <li>Không chia sẻ link này với bất kỳ ai</li>
                </ul>
              </div>
              <p>Nếu bạn gặp vấn đề khi đặt lại mật khẩu, vui lòng liên hệ đội ngũ hỗ trợ của chúng tôi.</p>
            </div>
            <div class="footer">
              <p>© 2026 Organic Produce Distribution. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const preferredProvider = process.env.PASSWORD_RESET_EMAIL_PROVIDER || process.env.EMAIL_PROVIDER || 'gmail_api';
    await this.sendViaApiProviders(mailOptions, 'password reset email', preferredProvider);
    console.log(`✅ Password reset email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────
  // Subscription emails
  // ────────────────────────────────────────────────────────────

  /** Gửi xác nhận đơn hàng định kỳ COD đã được tạo tự động */
  async sendSubscriptionOrderConfirmation(
    to: string,
    name: string,
    orderId: string,
    totalAmount: number,
    nextDeliveryDate: Date
  ): Promise<void> {
    const formattedAmount = totalAmount.toLocaleString('vi-VN') + ' ₫';
    const formattedDate = nextDeliveryDate.toLocaleDateString('vi-VN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const mailOptions = {
      from: `"Organic Produce Distribution" <${this.getDefaultSenderEmail()}>`,
      to,
      subject: `✅ Đơn hàng định kỳ #${orderId} đã được tạo tự động`,
      html: `
        <!DOCTYPE html><html><head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .info-box { background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 12px 16px; margin: 16px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
        </head><body>
        <div class="container">
          <div class="header"><h2>🌿 Đơn hàng định kỳ đã được tạo</h2></div>
          <div class="content">
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Hệ thống đã tự động tạo đơn hàng định kỳ của bạn. Shipper sẽ giao hàng và thu tiền mặt (COD) khi đến nơi.</p>
            <div class="info-box">
              <p><strong>Mã đơn hàng:</strong> #${orderId}</p>
              <p><strong>Tổng tiền:</strong> ${formattedAmount}</p>
              <p><strong>Phương thức thanh toán:</strong> Thanh toán khi nhận hàng (COD)</p>
              <p><strong>Lần giao tiếp theo:</strong> ${formattedDate}</p>
            </div>
            <p>Cảm ơn bạn đã tin tưởng sử dụng dịch vụ đặt hàng định kỳ của chúng tôi!</p>
          </div>
          <div class="footer"><p>© 2026 Organic Produce Distribution. All rights reserved.</p></div>
        </div>
        </body></html>
      `,
    };

    try {
      await this.sendViaApiProviders(mailOptions, 'subscription confirmation email', process.env.EMAIL_PROVIDER || 'gmail_api');
      console.log(`✅ Subscription confirmation email sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending subscription confirmation email:', error);
    }
  }

  /** Gửi yêu cầu thanh toán online cho đơn hàng định kỳ MoMo */
  async sendSubscriptionPaymentRequest(
    to: string,
    name: string,
    orderId: string,
    totalAmount: number,
    paymentMethod: string,
    deliveryDate: Date
  ): Promise<void> {
    const formattedAmount = totalAmount.toLocaleString('vi-VN') + ' ₫';
    const formattedDate = deliveryDate.toLocaleDateString('vi-VN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const paymentUrl = buildFrontendUrl(`/profile?tab=orders&highlight=${encodeURIComponent(orderId)}`);
    const methodLabel = paymentMethod?.toLowerCase() === 'momo' ? 'MoMo' : paymentMethod;

    const mailOptions = {
      from: `"Organic Produce Distribution" <${this.getDefaultSenderEmail()}>`,
      to,
      subject: `💳 Đơn hàng định kỳ #${orderId} — Vui lòng thanh toán trước ngày giao`,
      html: `
        <!DOCTYPE html><html><head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF6B35; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .info-box { background: #fff3e0; border-left: 4px solid #FF6B35; padding: 12px 16px; margin: 16px 0; border-radius: 4px; }
          .button { display: inline-block; padding: 14px 36px; background-color: #FF6B35; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; font-size: 16px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 10px 14px; border-radius: 5px; margin: 15px 0; }
        </style>
        </head><body>
        <div class="container">
          <div class="header"><h2>💳 Yêu cầu thanh toán đơn hàng định kỳ</h2></div>
          <div class="content">
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Đơn hàng định kỳ của bạn đã được tạo tự động và đang chờ thanh toán. Nhấn vào nút bên dưới để xem chi tiết và hoàn tất thanh toán qua <strong>${methodLabel}</strong>.</p>
            <div class="info-box">
              <p><strong>Mã đơn hàng:</strong> #${orderId}</p>
              <p><strong>Tổng tiền:</strong> ${formattedAmount}</p>
              <p><strong>Phương thức thanh toán:</strong> ${methodLabel}</p>
              <p><strong>Ngày giao hàng dự kiến:</strong> ${formattedDate}</p>
            </div>
            <div style="text-align:center;">
              <a href="${paymentUrl}" class="button">🔍 Kiểm tra &amp; Thanh toán đơn định kỳ</a>
            </div>
            <p style="text-align:center;font-size:13px;color:#888;margin-top:8px;">Bạn sẽ được yêu cầu đăng nhập nếu chưa vào tài khoản.</p>
            <div class="warning">
              <p style="margin:0;"><strong>⚠️ Lưu ý:</strong> Nếu bạn không thanh toán trước ngày giao, đơn hàng sẽ bị tạm hoãn. Bạn có thể thanh toán bất kỳ lúc nào qua liên kết trên.</p>
            </div>
          </div>
          <div class="footer"><p>© 2026 Organic Produce Distribution. All rights reserved.</p></div>
        </div>
        </body></html>
      `,
    };

    try {
      await this.sendViaApiProviders(mailOptions, 'subscription payment request email', process.env.EMAIL_PROVIDER || 'gmail_api');
      console.log(`✅ Subscription payment request email sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending subscription payment request email:', error);
    }
  }

  /** Nhắc nhở thanh toán đơn hàng định kỳ chưa thanh toán (giao ngày mai) */
  async sendSubscriptionPaymentReminder(
    to: string,
    name: string,
    orderId: string,
    totalAmount: number,
    paymentMethod: string
  ): Promise<void> {
    const formattedAmount = totalAmount.toLocaleString('vi-VN') + ' ₫';
    const paymentUrl = buildFrontendUrl(`/profile?tab=orders&highlight=${encodeURIComponent(orderId)}`);
    const methodLabel = paymentMethod?.toLowerCase() === 'momo' ? 'MoMo' : paymentMethod;

    const mailOptions = {
      from: `"Organic Produce Distribution" <${this.getDefaultSenderEmail()}>`,
      to,
      subject: `⏰ Nhắc nhở: Đơn hàng định kỳ #${orderId} của bạn sẽ được giao NGÀY MAI`,
      html: `
        <!DOCTYPE html><html><head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #9C27B0; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .info-box { background: #f3e5f5; border-left: 4px solid #9C27B0; padding: 12px 16px; margin: 16px 0; border-radius: 4px; }
          .button { display: inline-block; padding: 14px 36px; background-color: #9C27B0; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; font-size: 16px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .urgent { background-color: #ffebee; border: 1px solid #ef5350; padding: 10px 14px; border-radius: 5px; margin: 15px 0; }
        </style>
        </head><body>
        <div class="container">
          <div class="header"><h2>⏰ Nhắc nhở thanh toán — Giao hàng ngày mai!</h2></div>
          <div class="content">
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Đơn hàng định kỳ của bạn sẽ được giao vào <strong>ngày mai</strong> nhưng <strong>chưa được thanh toán</strong>. Vui lòng hoàn tất thanh toán sớm.</p>
            <div class="info-box">
              <p><strong>Mã đơn hàng:</strong> #${orderId}</p>
              <p><strong>Tổng tiền:</strong> ${formattedAmount}</p>
              <p><strong>Phương thức:</strong> ${methodLabel}</p>
            </div>
            <div style="text-align:center;">
              <a href="${paymentUrl}" class="button">🔍 Kiểm tra &amp; Thanh toán đơn định kỳ</a>
            </div>
            <p style="text-align:center;font-size:13px;color:#888;margin-top:8px;">Bạn sẽ được yêu cầu đăng nhập nếu chưa vào tài khoản.</p>
            <div class="urgent">
              <p style="margin:0;"><strong>🚨 Quan trọng:</strong> Vui lòng thanh toán trước khi giao hàng. Nếu không thanh toán, đơn hàng sẽ bị tạm hoãn và bạn sẽ không nhận được hàng ngày mai.</p>
            </div>
          </div>
          <div class="footer"><p>© 2026 Organic Produce Distribution. All rights reserved.</p></div>
        </div>
        </body></html>
      `,
    };

    try {
      await this.sendViaApiProviders(mailOptions, 'subscription payment reminder email', process.env.EMAIL_PROVIDER || 'gmail_api');
      console.log(`✅ Subscription payment reminder email sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending subscription payment reminder email:', error);
    }
  }

  // ────────────────────────────────────────────────────────────
  // Account lockout emails
  // ────────────────────────────────────────────────────────────

  /** Gửi email thông báo tài khoản bị khóa cho người dùng */
  async sendAccountLockedToUser(to: string, name: string, failedAttempts: number): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || this.getDefaultSenderEmail() || '';
    const provider = process.env.ACCOUNT_SECURITY_EMAIL_PROVIDER || 'gmail_api';
    const mailOptions = {
      from: `"Organic Produce Distribution" <${this.getDefaultSenderEmail()}>`,
      to,
      subject: '🔒 Tài khoản của bạn đã bị khóa',
      html: `
        <!DOCTYPE html><html><head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .info-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
        </head><body>
        <div class="container">
          <div class="header"><h2>🔒 Tài khoản bị khóa</h2></div>
          <div class="content">
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Tài khoản của bạn đã bị <strong>khóa tạm thời</strong> do nhập sai mật khẩu quá <strong>${failedAttempts} lần</strong> liên tiếp.</p>
            <div class="info-box">
              <p style="margin:0;"><strong>Để mở khóa tài khoản</strong>, vui lòng liên hệ quản trị viên:</p>
              <p style="margin:8px 0 0;">📧 Email: <a href="mailto:${adminEmail}">${adminEmail}</a></p>
            </div>
            <p>Nếu bạn không thực hiện những lần đăng nhập này, tài khoản của bạn có thể đang bị tấn công. Vui lòng liên hệ ngay với chúng tôi.</p>
          </div>
          <div class="footer"><p>© 2026 Organic Produce Distribution. All rights reserved.</p></div>
        </div>
        </body></html>
      `,
    };
    try {
      await this.sendViaApiProviders(mailOptions, 'account locked user email', provider);
      console.log(`✅ Account locked notification sent to user ${to}`);
    } catch (error) {
      console.error('❌ Error sending account locked email to user:', error);
    }
  }

  /** Gửi email thông báo cho admin khi có tài khoản bị khóa */
  async sendAccountLockedToAdmin(lockedUserName: string, lockedUserEmail: string, failedAttempts: number): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || this.getDefaultSenderEmail();
    if (!adminEmail) return;

    const provider = process.env.ACCOUNT_SECURITY_EMAIL_PROVIDER || 'gmail_api';

    const mailOptions = {
      from: `"Organic Produce Distribution" <${this.getDefaultSenderEmail()}>`,
      to: adminEmail,
      subject: `🚨 Tài khoản bị khóa: ${lockedUserEmail}`,
      html: `
        <!DOCTYPE html><html><head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f97316; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .info-box { background: #fff7ed; border-left: 4px solid #f97316; padding: 12px 16px; margin: 16px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
        </head><body>
        <div class="container">
          <div class="header"><h2>🚨 Cảnh báo: Tài khoản bị khóa</h2></div>
          <div class="content">
            <p>Một tài khoản vừa bị <strong>tự động khóa</strong> do nhập sai mật khẩu quá nhiều lần.</p>
            <div class="info-box">
              <p><strong>Tên:</strong> ${lockedUserName}</p>
              <p><strong>Email:</strong> ${lockedUserEmail}</p>
              <p><strong>Số lần nhập sai:</strong> ${failedAttempts}</p>
              <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            </div>
            <p>Người dùng cần bạn <strong>mở khóa thủ công</strong> qua trang quản trị trước khi có thể đăng nhập lại.</p>
          </div>
          <div class="footer"><p>© 2026 Organic Produce Distribution. All rights reserved.</p></div>
        </div>
        </body></html>
      `,
    };
    try {
      await this.sendViaApiProviders(mailOptions, 'account locked admin email', provider);
      console.log(`✅ Account locked notification sent to admin for user ${lockedUserEmail}`);
    } catch (error) {
      console.error('❌ Error sending account locked email to admin:', error);
    }
  }

  /** Gửi email xác nhận yêu cầu mở khóa đã được gửi đến admin */
  async sendUnlockRequestConfirmation(to: string, name: string): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || this.getDefaultSenderEmail() || '';
    const provider = process.env.ACCOUNT_SECURITY_EMAIL_PROVIDER || 'gmail_api';
    const mailOptions = {
      from: `"Organic Produce Distribution" <${this.getDefaultSenderEmail()}>`,
      to,
      subject: '📨 Yêu cầu mở khóa tài khoản đã được gửi',
      html: `
        <!DOCTYPE html><html><head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .info-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
        </head><body>
        <div class="container">
          <div class="header"><h2>📨 Yêu cầu mở khóa đã được gửi</h2></div>
          <div class="content">
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Yêu cầu mở khóa tài khoản của bạn đã được gửi đến quản trị viên.</p>
            <div class="info-box">
              <p style="margin:0;">Quản trị viên sẽ xem xét và mở khóa tài khoản trong thời gian sớm nhất. Bạn sẽ nhận được thông báo qua email <strong>${to}</strong> khi tài khoản được mở khóa.</p>
            </div>
            <p>Nếu cần hỗ trợ khẩn cấp, vui lòng liên hệ trực tiếp: <a href="mailto:${adminEmail}">${adminEmail}</a></p>
          </div>
          <div class="footer"><p>© 2026 Organic Produce Distribution. All rights reserved.</p></div>
        </div>
        </body></html>
      `,
    };
    try {
      await this.sendViaApiProviders(mailOptions, 'unlock request confirmation email', provider);
      console.log(`✅ Unlock request confirmation sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending unlock request confirmation email:', error);
    }
  }

  /** Gửi email thông báo cho admin khi nhận được yêu cầu mở khóa từ người dùng */
  async sendUnlockRequestToAdmin(lockedUserName: string, lockedUserEmail: string): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || this.getDefaultSenderEmail();
    if (!adminEmail) return;

    const provider = process.env.ACCOUNT_SECURITY_EMAIL_PROVIDER || 'gmail_api';

    const mailOptions = {
      from: `"Organic Produce Distribution" <${this.getDefaultSenderEmail()}>`,
      to: adminEmail,
      subject: `📩 Yêu cầu mở khóa từ: ${lockedUserEmail}`,
      html: `
        <!DOCTYPE html><html><head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .info-box { background: #eef2ff; border-left: 4px solid #6366f1; padding: 12px 16px; margin: 16px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
        </head><body>
        <div class="container">
          <div class="header"><h2>📩 Yêu cầu mở khóa tài khoản</h2></div>
          <div class="content">
            <p>Người dùng sau đang yêu cầu mở khóa tài khoản:</p>
            <div class="info-box">
              <p><strong>Tên:</strong> ${lockedUserName}</p>
              <p><strong>Email:</strong> ${lockedUserEmail}</p>
              <p><strong>Thời gian yêu cầu:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            </div>
            <p>Vui lòng đăng nhập vào trang quản trị để xem xét và mở khóa tài khoản này.</p>
          </div>
          <div class="footer"><p>© 2026 Organic Produce Distribution. All rights reserved.</p></div>
        </div>
        </body></html>
      `,
    };
    try {
      await this.sendViaApiProviders(mailOptions, 'unlock request admin email', provider);
      console.log(`✅ Unlock request forwarded to admin for user ${lockedUserEmail}`);
    } catch (error) {
      console.error('❌ Error sending unlock request to admin:', error);
    }
  }
}
