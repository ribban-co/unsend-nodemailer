import { SentMessageInfo, Transport } from "nodemailer";
import { version as VERSION } from '../package.json';
import { UnsendTransporterOptions } from "./types/transport";
import MailMessage from "nodemailer/lib/mailer/mail-message";
import { Unsend } from "unsend";
import { Address } from "nodemailer/lib/mailer";

type NodeMailerAddress = string | Address | Array<string | Address> | undefined;

export class UnsendTransport implements Transport<SentMessageInfo> {
    public name = 'UnsendMailTransporter';
    public version = VERSION;

    private unsend: Unsend;

    constructor(options: UnsendTransporterOptions) {
        const { apiKey, apiUrl } = options;

        if (!apiKey || apiKey.trim() === '') {
            throw new Error('Unsend API key is required. Please provide a valid API key in the transport options.');
        }

        this.unsend = new Unsend(apiKey, apiUrl);
    }

    public static makeTransport(options: UnsendTransporterOptions) {
        return new UnsendTransport(options);
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

            const toAddresses = this.toUnsendAddresses(mail.data.to);
            toAddresses.forEach(email => this.validateEmail(email, 'to'));

            if (mail.data.replyTo) {
                const replyToAddresses = this.toUnsendAddresses(mail.data.replyTo);
                replyToAddresses.forEach(email => this.validateEmail(email, 'replyTo'));
            }

            if (mail.data.cc) {
                const ccAddresses = this.toUnsendAddresses(mail.data.cc);
                ccAddresses.forEach(email => this.validateEmail(email, 'cc'));
            }

            if (mail.data.bcc) {
                const bccAddresses = this.toUnsendAddresses(mail.data.bcc);
                bccAddresses.forEach(email => this.validateEmail(email, 'bcc'));
            }
        } catch (validationError) {
            return callback(validationError as Error, null);
        }

        this.unsend.emails.send({
            from: mail.data.from as string,
            to: this.toUnsendAddresses(mail.data.to),
            replyTo: this.toUnsendAddresses(mail.data.replyTo),
            cc: this.toUnsendAddresses(mail.data.cc),
            bcc: this.toUnsendAddresses(mail.data.bcc),
            subject: mail.data.subject ?? '',
            text: mail.data.text?.toString() ?? '',
            html: mail.data.html?.toString() ?? '',
            attachments: mail.data.attachments?.map((attachment) => ({
                filename: attachment.filename?.toString() ?? '',
                content: attachment.content?.toString() ?? '',
            })),
        }).then(async (response) => {
            if (response.error) {
                const errorCode = response.error.code || 'UNKNOWN_ERROR';
                const errorMessage = response.error.message || 'An unknown error occurred';

                // Provide context-aware error messages
                let detailedMessage = `Unsend API Error (${errorCode}): ${errorMessage}`;

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
                    detailedMessage += '\n\nServer error. Please try again later or contact Unsend support.';
                }

                throw new Error(detailedMessage);
            }

            callback(null, response.data);
        }).catch((error) => {
            // Enhance error with additional context if it's a generic network error
            if (error.message && !error.message.includes('Unsend API Error')) {
                const enhancedError = new Error(
                    `Failed to send email via Unsend: ${error.message}\n\nPlease check:\n- Your network connection\n- API key validity\n- Unsend service status`
                );
                callback(enhancedError, null);
            } else {
                callback(error, null);
            }
        });
    };

    private validateEmail(email: string, fieldName: string): void {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error(`Invalid email address in "${fieldName}": "${email}". Please provide a valid email address (e.g., user@example.com).`);
        }
    }

    private toUnsendAddresses(address: NodeMailerAddress): Array<string> {
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