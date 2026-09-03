import { useEffect, useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ColorPicker, { HueSlider, Panel1, Preview } from 'reanimated-color-picker';

interface Props {
  visible: boolean;
  initialColor: string;
  onCancel: () => void;
  onSelect: (hex: string) => void;
}

export default function LycraColorPicker({ visible, initialColor, onCancel, onSelect }: Props) {
  const [color, setColor] = useState(initialColor);

  useEffect(() => {
    if (visible) setColor(initialColor);
  }, [visible, initialColor]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      {/* GestureHandlerRootView de novo: o Modal vive numa árvore nativa separada */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              padding: 24,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              gap: 18,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Escolha a cor da lycra</Text>

            <ColorPicker
              style={{ gap: 18 }}
              value={initialColor}
              onComplete={({ hex }) => setColor(hex)}
            >
              <Preview hideInitialColor />
              <Panel1 style={{ height: 200, borderRadius: 12 }} />
              <HueSlider />
            </ColorPicker>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={onCancel}
                style={{ flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#E5E7EB', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: 'bold', color: '#374151' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onSelect(color)}
                style={{ flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#0284C7', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>Usar cor</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
