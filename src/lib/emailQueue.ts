import Queue from "bull";
import { sendEmail } from "./nodemailer";

interface EmailJobData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

const emailQueue = new Queue<EmailJobData>("emailQueue", {
  redis: {
    host: "127.0.0.1",
    port: 6379,
  },
});

emailQueue.process(async (job) => {
  const { to, subject, text, html } = job.data;

  try {
    const result = await sendEmail({ to, subject, text, html });
    return result;
  } catch (error) {
    throw new Error(`Erro ao enviar email: ${error}`);
  }
});

export default emailQueue;
