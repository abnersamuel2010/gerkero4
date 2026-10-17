/**
 * Utilitário central para atualização do favicon e ícone da aba do navegador
 * Sincroniza dinamicamente de acordo com a logo configurada pelo restaurante.
 */

export function atualizarFavicon(url?: string | null): void {
  if (typeof document === 'undefined') return;

  const hrefFinal = url && url.trim().length > 0 ? url.trim() : '/img/logo.png';

  // Procura ou cria o link de favicon primário
  let linkIcon = document.getElementById('app-favicon') as HTMLLinkElement | null;
  if (!linkIcon) {
    linkIcon = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
  }

  if (linkIcon) {
    linkIcon.href = hrefFinal;
  } else {
    linkIcon = document.createElement('link');
    linkIcon.id = 'app-favicon';
    linkIcon.rel = 'icon';
    linkIcon.type = 'image/png';
    linkIcon.href = hrefFinal;
    document.head.appendChild(linkIcon);
  }

  // Atualiza também apple-touch-icon
  let linkApple = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
  if (linkApple) {
    linkApple.href = hrefFinal;
  } else {
    linkApple = document.createElement('link');
    linkApple.rel = 'apple-touch-icon';
    linkApple.href = hrefFinal;
    document.head.appendChild(linkApple);
  }
}
