import { WEATHER_API_KEY } from '@/utils';
import { Text, View } from 'react-native';

export default function Index() {
  console.log({ WEATHER_API_KEY });
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
