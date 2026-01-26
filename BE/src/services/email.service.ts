import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendVerificationEmail(to: string, token: string, name: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"Organic Produce Distribution" <${process.env.EMAIL_USER}>`,
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
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const mailOptions = {
      from: `"Organic Produce Distribution" <${process.env.EMAIL_USER}>`,
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
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
    }
  }

  async sendPasswordResetEmail(to: string, token: string, name: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Organic Produce Distribution" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Đặt lại mật khẩu của bạn',
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

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}
