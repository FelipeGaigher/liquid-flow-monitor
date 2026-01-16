interface BaseTemplateData {
  title: string;
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footer?: string;
}

function baseTemplate({ title, message, ctaLabel, ctaUrl, footer }: BaseTemplateData) {
  const button = ctaLabel && ctaUrl
    ? `<a href="${ctaUrl}" style="display:inline-block;background:#1a56db;color:#ffffff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:600;">${ctaLabel}</a>`
    : '';
  const footerText = footer ? `<p style="color:#6b7280;font-size:12px;margin:24px 0 0;">${footer}</p>` : '';

  return `
  <div style="font-family:Arial, sans-serif;background:#f9fafb;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">
      <h1 style="font-size:20px;margin:0 0 12px;color:#111827;">${title}</h1>
      <p style="font-size:14px;line-height:1.6;color:#374151;margin:0 0 20px;">${message}</p>
      ${button}
      ${footerText}
    </div>
  </div>
  `;
}

export function buildWelcomeEmail(name: string, appUrl: string) {
  const title = `Bem-vindo, ${name}!`;
  const message = 'Sua conta no TankControl foi criada com sucesso. Use o botao abaixo para acessar o sistema.';
  const footer = 'Se voce nao esperava este email, ignore esta mensagem.';

  return {
    subject: 'Bem-vindo ao TankControl',
    html: baseTemplate({ title, message, ctaLabel: 'Acessar o sistema', ctaUrl: appUrl, footer }),
    text: `${title}\n\n${message}\n\nAcesse: ${appUrl}\n\n${footer}`,
  };
}

export function buildPasswordResetEmail(name: string, resetUrl: string, expiresHours: number) {
  const title = `Ola, ${name}`;
  const message = `Recebemos uma solicitacao de redefinicao de senha. Este link expira em ${expiresHours} hora(s).`;
  const footer = 'Se voce nao solicitou esta alteracao, ignore este email.';

  return {
    subject: 'Redefinicao de senha',
    html: baseTemplate({ title, message, ctaLabel: 'Redefinir senha', ctaUrl: resetUrl, footer }),
    text: `${title}\n\n${message}\n\nRedefina sua senha: ${resetUrl}\n\n${footer}`,
  };
}

export function buildLowStockEmail(params: {
  tankName: string;
  productName?: string;
  siteName?: string;
  currentVolume: number;
  minAlert: number;
  appUrl?: string;
}) {
  const { tankName, productName, siteName, currentVolume, minAlert, appUrl } = params;
  const title = 'Alerta de estoque baixo';
  const location = siteName ? `Site: ${siteName}` : 'Site: Nao informado';
  const product = productName ? `Produto: ${productName}` : 'Produto: Nao informado';
  const message = `O tanque ${tankName} atingiu o nivel minimo de alerta.\n${product}\n${location}\nVolume atual: ${currentVolume} L\nMinimo configurado: ${minAlert} L`;
  const footer = 'Se voce nao esperava este email, ignore esta mensagem.';

  return {
    subject: `Alerta de estoque - ${tankName}`,
    html: baseTemplate({
      title,
      message: message.replace(/\n/g, '<br />'),
      ctaLabel: appUrl ? 'Acessar o sistema' : undefined,
      ctaUrl: appUrl,
      footer,
    }),
    text: `${title}\n\n${message}`,
  };
}
