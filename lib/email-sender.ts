export interface EmailSender {
  sendVerificationCode(input: { email: string; code: string; expiresAt: string }): Promise<void>;
}

/** Local development sender. Replace this adapter with SMTP, SES, or DirectMail in production. */
export const emailSender: EmailSender = {
  async sendVerificationCode({ email, code, expiresAt }) {
    console.info(`[EmailSender:console] ${email} 的登录验证码是 ${code}，有效期至 ${expiresAt}`);
  },
};
