import nodemailer from 'nodemailer';

export interface SignupNotificationPayload {
  email: string;
  nom?: string;
  nom_atelier?: string;
  telephone?: string;
  ville?: string;
  pays?: string;
  device?: string;
  ip?: string;
  unsubscribeToken?: string;
}

/**
 * Envoie un email de bienvenue court, chaleureux et optimisé pour connexions 3G
 */
export async function sendWelcomeEmail(user: SignupNotificationPayload): Promise<boolean> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.warn('[Notifications] GMAIL_USER ou GMAIL_APP_PASSWORD non configuré. Envoi d’email ignoré.');
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
    const prenom = user.nom ? user.nom.split(' ')[0] : 'Artisan';
    const atelier = user.nom_atelier ? ` (${user.nom_atelier})` : '';
    const unsubscribeLink = user.unsubscribeToken
      ? `${appUrl}/api/unsubscribe?token=${encodeURIComponent(user.unsubscribeToken)}`
      : `${appUrl}/api/unsubscribe`;

    const subject = `Bienvenue sur Ourlette ! Vos 3 premières étapes 🧵`;

    const textContent = `Bonjour ${prenom} !

Merci d'avoir rejoint Ourlette, le carnet de commandes conçu spécialement pour les ateliers de couture${atelier}.

Voici vos 3 premières étapes simples pour démarrer aujourd'hui :
1. Ajouter votre premier client (nom et contact WhatsApp)
2. Enregistrer ses mesures précises (sauvegardées pour toujours)
3. Créer votre première commande pour suivre la coupe, l'essayage et la livraison

Astuce : Notre application fonctionne même sans connexion Internet !

Une question ou besoin d'un coup de main ?
Répondez simplement à cet email, nous vous répondrons directement avec plaisir.

Excellente couture,
L'équipe Ourlette
${appUrl}

Pour ne plus recevoir nos emails d'accompagnement : ${unsubscribeLink}
`;

    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur Ourlette</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAFAF8; color: #2B1215; margin: 0; padding: 24px; line-height: 1.5;">
  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #E5C0C4; border-radius: 20px; padding: 28px; box-shadow: 0 4px 12px rgba(43,18,21,0.04);">
    <div style="border-bottom: 2px solid #D4AF37; padding-bottom: 14px; margin-bottom: 20px;">
      <h1 style="color: #2B1215; font-size: 22px; margin: 0; font-weight: 800;">
        Ourlette<span style="color: #D4AF37;">.</span>
      </h1>
      <p style="color: #5F1C25; font-size: 13px; margin: 4px 0 0 0; font-weight: 600;">L'atelier de couture connecté</p>
    </div>

    <p style="font-size: 15px; margin-bottom: 16px;">Bonjour <strong>${prenom}</strong>,</p>

    <p style="font-size: 14px; color: #3d2226; margin-bottom: 18px;">
      Merci d'avoir rejoint <strong>Ourlette</strong>${atelier} ! Votre carnet de commandes moderne est maintenant prêt à l'emploi.
    </p>

    <div style="background-color: #FAFAF8; border-left: 4px solid #AC0C21; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
      <p style="font-weight: 700; font-size: 13px; margin: 0 0 10px 0; color: #AC0C21; text-transform: uppercase; letter-spacing: 0.5px;">
        Vos 3 premières actions recommandées :
      </p>
      <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #2B1215;">
        <li style="margin-bottom: 8px;"><strong>Ajoutez un premier client</strong> avec son numéro WhatsApp.</li>
        <li style="margin-bottom: 8px;"><strong>Renseignez sa fiche de mesures</strong> (taille, poitrine, hanches, etc.).</li>
        <li style="margin-bottom: 0;"><strong>Créez votre première commande</strong> pour suivre l'acompte et la date promise.</li>
      </ol>
    </div>

    <p style="font-size: 13px; color: #5F1C25; margin-bottom: 20px; background-color: #f7f1eb; padding: 10px 14px; border-radius: 10px;">
      💡 <em>Astuce :</em> Vous pouvez ouvrir Ourlette même en cas de faible réseau ou hors ligne, vos fiches restent toujours accessibles.
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${appUrl}/commandes" style="display: inline-block; background-color: #AC0C21; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 9999px;">
        Ouvrir mon carnet de commandes &rarr;
      </a>
    </div>

    <p style="font-size: 13px; color: #555555; margin-bottom: 16px;">
      <strong>Une question ou besoin d'aide ?</strong><br>
      Répondez simplement à cet email, nous vous lisons et vous répondons personnellement.
    </p>

    <p style="font-size: 13px; color: #2B1215; margin: 20px 0 0 0; font-weight: 600;">
      À très bientôt à l'atelier,<br>
      <span style="color: #AC0C21;">L'équipe Ourlette</span>
    </p>

    <div style="border-top: 1px solid #E5C0C4; margin-top: 24px; padding-top: 14px; font-size: 11px; color: #888888; text-align: center;">
      <p style="margin: 0 0 6px 0;">Ourlette &bull; Gestion d'ateliers de couture africains</p>
      <a href="${unsubscribeLink}" style="color: #888888; text-decoration: underline;">Se désinscrire des emails d'accompagnement</a>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"Ourlette" <${gmailUser}>`,
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
 */
export async function notifyTelegramNewSignup(user: SignupNotificationPayload): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[Notifications] TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID non configuré. Alerte Telegram ignorée.');
    return false;
  }

  try {
    const prenomNom = user.nom || 'Non spécifié';
    const nomAtelier = user.nom_atelier || 'Non spécifié';
    const telephone = user.telephone || 'Non renseigné';
    const localisation = [user.ville, user.pays].filter(Boolean).join(', ') || 'Non renseignée';
    const device = user.device || 'Non détecté';
    const ip = user.ip || 'Non détectée';
    const dateFormatted = new Date().toLocaleString('fr-FR', {
      timeZone: 'Africa/Porto-Novo',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const message = `🧵 *NOUVELLE INSCRIPTION OURLETTE !*

👤 *Couturier :* ${escapeMarkdown(prenomNom)}
🏪 *Atelier :* ${escapeMarkdown(nomAtelier)}
📧 *Email :* ${escapeMarkdown(user.email)}
📱 *Téléphone :* ${escapeMarkdown(telephone)}
📍 *Localisation :* ${escapeMarkdown(localisation)}
💻 *Appareil :* ${escapeMarkdown(device)}
🌐 *Adresse IP :* ${escapeMarkdown(ip)}
📅 *Date :* ${escapeMarkdown(dateFormatted)}
`;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Notifications] Réponse Telegram non-200:', errText);
      return false;
    }

    console.log(`[Notifications] Notification Telegram envoyée avec succès pour ${user.email}`);
    return true;
  } catch (err: any) {
    console.error('[Notifications] Erreur envoi Telegram:', err?.message || err);
    return false;
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}
