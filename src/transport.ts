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

        this.unsend = new Unsend(apiKey, apiUrl);
    }

    public static makeTransport(options: UnsendTransporterOptions) {
        return new UnsendTransport(options);
    }

    async send(mail: MailMessage, callback: (err: Error | null, info: SentMessageInfo) => void): Promise<SentMessageInfo> {
        if (!mail.data.from || !mail.data.to) {
            return callback(new Error('No subject, from or to address specified. Ensure that "subject", "from" and "to" fields are set.'), null);
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
                throw new Error(`[${response.error.code}]: ${response.error.message}`);
            }

            callback(null, response.data);
        }).catch((error) => {
            callback(error, null);
        });
    };

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