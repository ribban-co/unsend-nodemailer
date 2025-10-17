import { SentMessageInfo, Transport } from "nodemailer";
import { version as VERSION } from '../package.json';
import { UsesendTransporterOptions } from "./types/transport";
import MailMessage from "nodemailer/lib/mailer/mail-message";
import { UseSend } from "usesend-js";
import { Address } from "nodemailer/lib/mailer";

type NodeMailerAddress = string | Address | Array<string | Address> | undefined;

export class UsesendTransport implements Transport<SentMessageInfo> {
    public name = 'UsesendMailTransporter';
    public version = VERSION;

    private usesend: UseSend;

    constructor(options: UsesendTransporterOptions) {
        const { apiKey, apiUrl } = options;

        if (!apiKey || apiKey.trim() === '') {
            throw new Error('Usesend API key is required. Please provide a valid API key in the transport options.');
        }

        this.usesend = new UseSend(apiKey, apiUrl);
    }

    public static makeTransport(options: UsesendTransporterOptions) {
        return new UsesendTransport(options);
    }

    async send(mail: MailMessage, callback: (err: Error | null, info: SentMessageInfo) => void): Promise<SentMessageInfo> {
        // Validate required fields
        if (!mail.data.from) {
            return callback(new Error('Missing required field "from". Please specify a sender email address.'), null);
        }

        if (!mail.data.to) {
            return callback(new Error('Missing required field "to". Please specify at least one recipient email address.'), null);
        }

        if (!mail.data.subject) {
            return callback(new Error('Missing required field "subject". Please specify an email subject.'), null);
        }

        // Validate email addresses
        try {
            const fromEmail = typeof mail.data.from === 'string' ? mail.data.from : (mail.data.from as Address).address;
            this.validateEmail(fromEmail, 'from');

            const toAddresses = this.toUsesendAddresses(mail.data.to);
            toAddresses.forEach(email => this.validateEmail(email, 'to'));

            if (mail.data.replyTo) {
                const replyToAddresses = this.toUsesendAddresses(mail.data.replyTo);
                replyToAddresses.forEach(email => this.validateEmail(email, 'replyTo'));
            }

            if (mail.data.cc) {
                const ccAddresses = this.toUsesendAddresses(mail.data.cc);
                ccAddresses.forEach(email => this.validateEmail(email, 'cc'));
            }

            if (mail.data.bcc) {
                const bccAddresses = this.toUsesendAddresses(mail.data.bcc);
                bccAddresses.forEach(email => this.validateEmail(email, 'bcc'));
            }
        } catch (validationError) {
            return callback(validationError as Error, null);
        }

        // Prepare email payload - only include non-empty fields
        const emailPayload: any = {
            from: mail.data.from as string,
            to: this.toUsesendAddresses(mail.data.to),
            subject: mail.data.subject ?? '',
        };

        // Only add optional fields if they have values
        const replyTo = this.toUsesendAddresses(mail.data.replyTo);
        if (replyTo.length > 0) emailPayload.replyTo = replyTo;

        const cc = this.toUsesendAddresses(mail.data.cc);
        if (cc.length > 0) emailPayload.cc = cc;

        const bcc = this.toUsesendAddresses(mail.data.bcc);
        if (bcc.length > 0) emailPayload.bcc = bcc;

        // Add text/html content - both are required by useSend API
        const textContent = mail.data.text?.toString();
        const htmlContent = mail.data.html?.toString();

        // If only HTML is provided, strip HTML tags for text version
        if (htmlContent && !textContent) {
            emailPayload.text = htmlContent.replace(/<[^>]*>/g, '').trim();
            emailPayload.html = htmlContent;
        } else if (textContent && !htmlContent) {
            // If only text is provided, use it for both
            emailPayload.text = textContent;
            emailPayload.html = textContent;
        } else if (textContent && htmlContent) {
            // Both provided
            emailPayload.text = textContent;
            emailPayload.html = htmlContent;
        } else {
            // Neither provided - this should not happen due to nodemailer requirements
            return callback(new Error('Either text or html content must be provided.'), null);
        }

        // Add attachments if present
        if (mail.data.attachments && mail.data.attachments.length > 0) {
            emailPayload.attachments = mail.data.attachments.map((attachment) => ({
                filename: attachment.filename?.toString() ?? '',
                content: attachment.content?.toString() ?? '',
            }));
        }

        this.usesend.emails.send(emailPayload).then(async (response) => {
            if (response.error) {
                const error = response.error as any;

                // Check if it's a Zod validation error
                if (error.name === 'ZodError' && error.issues) {
                    const issues = error.issues.map((issue: any) =>
                        `  - ${issue.path.join('.')}: ${issue.message}`
                    ).join('\n');
                    throw new Error(`Usesend API Validation Error:\n${issues}`);
                }

                // Check if error is nested (error.error structure)
                const actualError = error.error || error;
                const errorCode = actualError.code || 'UNKNOWN_ERROR';
                const errorMessage = actualError.message || 'An unknown error occurred';

                // Provide context-aware error messages
                let detailedMessage = `Usesend API Error (${errorCode}): ${errorMessage}`;

                // Add helpful hints based on error code
                if (errorCode === '400' || errorCode.toString().startsWith('400')) {
                    detailedMessage += '\n\nPossible causes:\n- Invalid email format\n- Missing required fields\n- Invalid API key\n- Malformed request data';
                } else if (errorCode === '401' || errorCode.toString().startsWith('401')) {
                    detailedMessage += '\n\nAuthentication failed. Please check your API key.';
                } else if (errorCode === '403' || errorCode.toString().startsWith('403')) {
                    detailedMessage += '\n\nAccess forbidden. Your API key may not have permission to perform this action.';
                } else if (errorCode === '429' || errorCode.toString().startsWith('429')) {
                    detailedMessage += '\n\nRate limit exceeded. Please wait before sending more emails.';
                } else if (errorCode.toString().startsWith('5')) {
                    detailedMessage += '\n\nServer error. Please try again later or contact Usesend support.';
                }

                throw new Error(detailedMessage);
            }

            callback(null, response.data);
        }).catch((error) => {
            // Enhance error with additional context if it's a generic network error
            if (error.message && !error.message.includes('Usesend API Error')) {
                const enhancedError = new Error(
                    `Failed to send email via Usesend: ${error.message}\n\nPlease check:\n- Your network connection\n- API key validity\n- Usesend service status`
                );
                callback(enhancedError, null);
            } else {
                callback(error, null);
            }
        });
    };

    private validateEmail(email: string, fieldName: string): void {
        // Extract email address from "Display Name <email@example.com>" format
        const angleMatch = email.match(/<([^>]+)>/);
        const emailToValidate = angleMatch ? angleMatch[1].trim() : email.trim();

        // Email regex that handles basic validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailToValidate)) {
            throw new Error(`Invalid email address in "${fieldName}": "${email}". Please provide a valid email address (e.g., user@example.com or "Name <user@example.com>").`);
        }
    }

    private toUsesendAddresses(address: NodeMailerAddress): Array<string> {
        if (!address) {
            return [];
        }

        if (typeof address === 'string') {
            return [address];
        }

        if (Array.isArray(address)) {
            return address.map((address) => {
                if (typeof address === 'string') {
                    return address;
                }

                return address.address;
            });
        }

        return [address.address];
    }
}