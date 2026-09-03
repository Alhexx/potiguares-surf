import { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { isLightColor } from '../lib/color';

interface Props {
  visible: boolean;
  initialColor: string;
  onCancel: () => void;
  onSelect: (hex: string) => void;
}

// Paleta pensada pra lycra de surf (cores fortes e bem distintas entre si).
const PRESETS = [
  '#EF4444', '#F97316', '#FBBF24', '#FACC15',
  '#22C55E', '#10B981', '#14B8A6', '#3B82F6',
  '#2563EB', '#1E3A8A', '#8B5CF6', '#EC4899',
  '#F9FAFB', '#9CA3AF', '#111827',
];

const isValidHex = (v: string) => /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(v.trim());

export default function LycraColorPicker({ visible, initialColor, onCancel, onSelect }: Props) {
  const [color, setColor] = useState(initialColor);
  const [hex, setHex] = useState(initialColor);

  useEffect(() => {
    if (visible) {
      setColor(initialColor);
      setHex(initialColor);
    }
  }, [visible, initialColor]);

  const pick = (c: string) => {
    setColor(c);
    setHex(c);
  };

  const onHexChange = (v: string) => {
    setHex(v);
    if (isValidHex(v)) setColor(v.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            padding: 24,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>
            Cor da lycra
          </Text>

          <ScrollView
            horizontal={false}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}
            style={{ marginBottom: 20 }}
          >
            {PRESETS.map((c) => {
              const selected = c.toLowerCase() === color.toLowerCase();
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => pick(c)}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 10,
                    backgroundColor: c,
                    borderWidth: selected ? 3 : 1,
                    borderColor: selected ? '#0284C7' : '#D1D5DB',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selected && (
                    <Text style={{ color: isLightColor(c) ? '#111827' : '#FFFFFF', fontWeight: 'bold' }}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                backgroundColor: isValidHex(hex) ? color : '#FFFFFF',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                marginRight: 12,
              }}
            />
            <TextInput
              value={hex}
              onChangeText={onHexChange}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="#00AAFF"
              placeholderTextColor="#9CA3AF"
              maxLength={7}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: isValidHex(hex) ? '#D1D5DB' : '#EF4444',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: '#111827',
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={onCancel}
              style={{ flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#E5E7EB', alignItems: 'center' }}
            >
              <Text style={{ fontWeight: 'bold', color: '#374151' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!isValidHex(hex)}
              onPress={() => onSelect(color)}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 10,
                backgroundColor: isValidHex(hex) ? '#0284C7' : '#93C5FD',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>Usar cor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
