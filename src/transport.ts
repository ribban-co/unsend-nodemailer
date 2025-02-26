import { SentMessageInfo, Transport } from "nodemailer";
import { version as VERSION } from '../package.json';
import { UnsendTransporterOptions } from "./types/transport";
import MailMessage from "nodemailer/lib/mailer/mail-message";

export class UnsendTransport implements Transport<SentMessageInfo> {
    public name = 'UnsendMailTransporter';
    public version = VERSION;

    private readonly apiKey: string;
    private readonly apiUrl: string;

    constructor(options: UnsendTransporterOptions) {
        const { apiKey, apiUrl = 'https://app.unsend.dev' } = options;

        this.apiKey = apiKey;
        this.apiUrl = apiUrl.endsWith('/') ? `${apiUrl}api/v1` : `${apiUrl}/api/v1`;
    }

    async send(mail: MailMessage, callback: (err: Error | null, info: SentMessageInfo) => void): Promise<SentMessageInfo> {
        if (!mail.data.from || !mail.data.to) {
            return callback(new Error('No subject, from or to address specified. Ensure that "subject", "from" and "to" fields are set.'), null);
        }

        fetch(`${this.apiUrl}/emails`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: mail.data.from,
                to: mail.data.to,
                replyTo: mail.data.replyTo,
                cc: mail.data.cc,
                bcc: mail.data.bcc,
                subject: mail.data.subject ?? '',
                text: mail.data.text?.toString() ?? '',
                html: mail.data.html?.toString() ?? '',
                attachments: mail.data.attachments?.map((attachment) => ({
                    filename: attachment.filename,
                    content: attachment.content,
                })),
            })
        }).then(async (response) => {
            if (!response.ok) {
                throw new Error(`[${response.status}]: ${response.statusText}`);
            }

            const data = await response.json();

            callback(null, data);
        }).catch((error) => {
            callback(error, null);
        });
    };
    
}