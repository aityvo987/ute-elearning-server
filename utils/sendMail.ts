import nodemailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();


interface EmailOptions {
    email: string;
    subject: string;
    template: string;
    data: { [key: string]: any };
}

//senEmail() Function: send to user email user nodemailer library
const sendMail = async (options: EmailOptions): Promise<void> => {
    const transporter: Transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        service: process.env.SMTP_SERVICE,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const { email, subject, template, data } = options;

    //get the path to the email template file

    const templatePath: string = path.join(__dirname, '../mails', template);

    //render the email template with EJS(dynamically generated mail content)

    const html: string = await ejs.renderFile(templatePath, data);

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html
    };

    await transporter.sendMail(mailOptions);
}

export default sendMail;