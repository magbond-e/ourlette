import nodemailer from 'nodemailer';

export interface SignupUser {
  email: string;
  nom?: string;
  nom_atelier?: string;
  telephone?: string;
  ville?: string;
  pays?: string;
  device?: string;
  ip?: string;
  unsubscribeToken?: string;
  [key: string]: any;
}

/**
 * Fonction utilitaire pour échapper les caractères spéciaux HTML
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Envoie un email de bienvenue court, chaleureux et optimisé pour connexions 3G
 * via Nodemailer + SMTP Gmail (service "gmail")
 */
export async function sendWelcomeEmail(user: SignupUser): Promise<boolean> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.warn('[Notifications] GMAIL_USER ou GMAIL_APP_PASSWORD non configuré. Envoi d’email ignoré.');
    return false;
  }

  if (!user?.email) {
    console.warn('[Notifications] Aucun email fourni pour sendWelcomeEmail.');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ourlette.app';
    const prenom = user.nom && user.nom !== 'Artisan Couturier'
      ? user.nom.split(' ')[0]
      : 'Artisan';
    const atelierPrecision = user.nom_atelier && user.nom_atelier !== 'Mon Atelier'
      ? ` (${user.nom_atelier})`
      : '';

    const subject = 'Bienvenue sur Ourlette ! Vos 3 premières actions 🧵';

    const textContent = `Bonjour ${prenom} !

Merci d'avoir rejoint Ourlette${atelierPrecision}, l'outil conçu pour simplifier la gestion de votre atelier de couture.

Voici vos 3 premières actions recommandées :
1. Ajouter votre premier client (son nom et son contact WhatsApp)
2. Enregistrer ses mesures précises (sauvegardées et retrouvables à tout moment)
3. Créer votre première commande pour suivre vos délais et vos acomptes

Une question ou besoin d'un coup de main ?
Répondez simplement à cet email, nous vous répondrons directement avec grand plaisir !

Bonne couture et plein succès pour votre atelier,
L'équipe Ourlette
${appUrl}
`;

    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur Ourlette</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAFAF8; color: #2B1215; margin: 0; padding: 20px; line-height: 1.5;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #E5C0C4; border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(43,18,21,0.04);">
    <div style="border-bottom: 2px solid #D4AF37; padding-bottom: 12px; margin-bottom: 18px;">
      <h1 style="color: #2B1215; font-size: 20px; margin: 0; font-weight: 800;">
        Ourlette<span style="color: #D4AF37;">.</span>
      </h1>
      <p style="color: #5F1C25; font-size: 12px; margin: 4px 0 0 0; font-weight: 600;">L'atelier de couture connecté</p>
    </div>

    <p style="font-size: 15px; margin: 0 0 14px 0;">Bonjour <strong>${escapeHtml(prenom)}</strong>,</p>

    <p style="font-size: 14px; color: #3d2226; margin: 0 0 16px 0;">
      Merci d'avoir rejoint <strong>Ourlette</strong>${escapeHtml(atelierPrecision)} ! Votre carnet de commandes moderne est maintenant prêt à l'emploi.
    </p>

    <div style="background-color: #FAFAF8; border-left: 4px solid #AC0C21; border-radius: 8px; padding: 14px 16px; margin-bottom: 18px;">
      <p style="font-weight: 700; font-size: 13px; margin: 0 0 10px 0; color: #AC0C21; text-transform: uppercase; letter-spacing: 0.5px;">
        Vos 3 premières actions :
      </p>
      <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #2B1215; line-height: 1.6;">
        <li style="margin-bottom: 6px;"><strong>Ajoutez un premier client</strong> avec son numéro WhatsApp.</li>
        <li style="margin-bottom: 6px;"><strong>Enregistrez ses mesures</strong> (toujours accessibles, même hors-ligne).</li>
        <li><strong>Créez votre première commande</strong> pour suivre l'acompte et la date promise.</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 22px 0;">
      <a href="${appUrl}/commandes" style="display: inline-block; background-color: #AC0C21; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 26px; border-radius: 9999px;">
        Ouvrir mon carnet de commandes &rarr;
      </a>
    </div>

    <p style="font-size: 13px; color: #555555; margin: 16px 0;">
      <strong>Une question ou besoin d'aide ?</strong><br>
      Répondez simplement à cet email, nous vous lisons et vous répondons avec grand plaisir.
    </p>

    <p style="font-size: 13px; color: #2B1215; margin: 18px 0 0 0; font-weight: 600;">
      À très bientôt à l'atelier,<br>
      <span style="color: #AC0C21;">L'équipe Ourlette</span>
    </p>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `Ourlette <${gmailUser}>`,
      to: user.email,
      replyTo: gmailUser,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[Notifications] Email de bienvenue envoyé avec succès à ${user.email}`);
    return true;
  } catch (err: any) {
    console.error('[Notifications] Erreur envoi email bienvenue:', err?.message || err);
    return false;
  }
}

/**
 * Envoie une notification instantanée Telegram à l'administrateur lors d'une nouvelle inscription
 * via l'API sendMessage avec fetch
 */
export async function notifyTelegramNewSignup(user: SignupUser): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[Notifications] TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID non configuré. Alerte Telegram ignorée.');
    return false;
  }

  try {
    const nomAffiche = user.nom || (user.nom_atelier ? `Atelier ${user.nom_atelier}` : 'Non spécifié');
    const emailAffiche = user.email || 'Non spécifié';
    const localisation = [user.ville, user.pays].filter(Boolean).join(', ');

    let dateFormatted: string;
    try {
      dateFormatted = new Date().toLocaleString('fr-FR', {
        timeZone: 'Africa/Porto-Novo',
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      dateFormatted = new Date().toLocaleString('fr-FR');
    }

    const messageLines = [
      '🧵 <b>NOUVELLE INSCRIPTION SUR OURLETTE !</b>',
      '',
      `👤 <b>Nom :</b> ${escapeHtml(nomAffiche)}`,
      user.nom_atelier ? `🏪 <b>Atelier :</b> ${escapeHtml(user.nom_atelier)}` : null,
      `📧 <b>Email :</b> ${escapeHtml(emailAffiche)}`,
      user.telephone ? `📱 <b>Téléphone :</b> ${escapeHtml(user.telephone)}` : null,
      localisation ? `📍 <b>Localisation :</b> ${escapeHtml(localisation)}` : null,
      `📅 <b>Date :</b> ${escapeHtml(dateFormatted)}`,
    ].filter(Boolean);

    const message = messageLines.join('\n');

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Notifications] Réponse Telegram non-200:', response.status, errText);
      return false;
    }

    console.log(`[Notifications] Notification Telegram envoyée avec succès pour ${user.email}`);
    return true;
  } catch (err: any) {
    console.error('[Notifications] Erreur envoi Telegram:', err?.message || err);
    return false;
  }
}
