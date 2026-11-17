import { sendEmail } from "../config/nodemailer.config.js";
import { sendFailure, sendSuccess } from "../utils/api-response.js";
import { validateEmail, validateMessage, validateName, validateSubject } from "../utils/user.validation.js";

export async function submitContactForm(req, res) {

  const name = validateName(req.body?.name);
  const email = validateEmail(req.body?.email);
  const subject = validateSubject(req.body?.subject);
  const message = validateMessage(req.body?.message);

  const validationError = name.error || email.error || subject.error || message.error;

  if (validationError) {
    return sendFailure(res, 400, validationError);
  }

  try {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      replyTo: email.value,
      subject: `Contact form: ${subject.value}`,
      text: [`Name: ${name.value}`, `Email: ${email.value}`, ``, `Subject: ${subject.value}`, message.value].join("\n"),
    });
    return sendSuccess(res, 200, "Your message has been sent", null);
  } catch (error) {
    console.error("Could not send contact form email:", error);
    return sendFailure(res, 500, "Could not send your message. Please try again later.");
  }
}
