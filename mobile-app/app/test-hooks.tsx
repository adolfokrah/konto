import React, { useState, useMemo } from 'react';
import { Text, View, Button } from 'react-native';

export default function TestHooks() {
  const [count, setCount] = useState(0);
  
  const doubledCount = useMemo(() => {
    return count * 2;
  }, [count]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>React Hooks Test</Text>
      <Text style={{ fontSize: 16, marginBottom: 10 }}>Count: {count}</Text>
      <Text style={{ fontSize: 16, marginBottom: 20 }}>Doubled: {doubledCount}</Text>
      <Button title="Increment" onPress={() => setCount(count + 1)} />
    </View>
  );
}
