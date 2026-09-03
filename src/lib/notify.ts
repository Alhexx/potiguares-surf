import { Alert, Platform } from 'react-native';

function webToast(text: string) {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText =
    'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);' +
    'background:#111827;color:#fff;padding:12px 20px;border-radius:10px;' +
    'font:14px system-ui,sans-serif;z-index:99999;max-width:80%;text-align:center;' +
    'box-shadow:0 4px 12px rgba(0,0,0,.3)';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/** Feedback rápido. Alert nativo no app; toast no web (Alert não existe no web). */
export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') webToast(message ? `${title}: ${message}` : title);
  else Alert.alert(title, message);
}

/** Confirmação destrutiva. window.confirm no web; Alert com botões no app. */
export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = 'Confirmar',
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: confirmLabel, style: 'destructive', onPress: onConfirm },
    ]);
  }
}
