import { useEffect, useRef, useState } from 'react';
import { Text, TextStyle } from 'react-native';

function fmt(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

interface Props {
  status?: string;
  endsAtMs?: number | null;
  durationMinutes?: number | null;
  remainingMs?: number | null;
  /** Chamado UMA vez quando o cronômetro de uma bateria 'live' zera. */
  onExpire?: () => void;
  style?: TextStyle | TextStyle[];
}

/**
 * Cronômetro regressivo da bateria. O alvo (`endsAtMs`) é um timestamp absoluto
 * gravado no Firestore, então todos os aparelhos mostram o mesmo tempo.
 * ponytail: usa o relógio de cada aparelho — deriva de segundos entre devices, ok pra surf.
 */
export default function HeatTimer({
  status,
  endsAtMs,
  durationMinutes,
  remainingMs,
  onExpire,
  style,
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  const running = status === 'live' && !!endsAtMs;

  useEffect(() => {
    if (!running) return;
    firedRef.current = false;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [running, endsAtMs]);

  let ms: number;
  if (running) ms = (endsAtMs as number) - now;
  else if (status === 'waiting' && remainingMs != null) ms = remainingMs;
  else ms = (durationMinutes ?? 0) * 60000;

  useEffect(() => {
    if (running && ms <= 0 && !firedRef.current) {
      firedRef.current = true;
      onExpire?.();
    }
  }, [running, ms, onExpire]);

  const label =
    status === 'finished'
      ? 'Encerrada'
      : running
        ? fmt(ms)
        : `${fmt(ms)} (parado)`;

  return <Text style={style}>{label}</Text>;
}
