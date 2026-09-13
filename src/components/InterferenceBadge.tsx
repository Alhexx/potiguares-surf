import { Text, View } from 'react-native';

/**
 * Selo de interferência. 1 = penalizado (só a melhor onda conta),
 * 2+ = desclassificado. Nada é exibido quando não há interferência.
 */
export default function InterferenceBadge({
  interferences,
  compact,
}: {
  interferences: number;
  compact?: boolean;
}) {
  if (!interferences) return null;
  const dq = interferences >= 2;

  return (
    <View
      style={{
        backgroundColor: dq ? '#DC2626' : '#F59E0B',
        paddingHorizontal: compact ? 6 : 8,
        paddingVertical: compact ? 1 : 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: compact ? 9 : 11 }}>
        {dq
          ? `DESCLASSIFICADO (${interferences} INTERF.)`
          : compact
            ? 'INTERF.'
            : '⚠️ INTERFERÊNCIA'}
      </Text>
    </View>
  );
}
