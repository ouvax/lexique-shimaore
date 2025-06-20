import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function StatsScreen() {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setProgress(docSnap.data().progress);
    };
    fetchStats();
  }, []);

  return (
    <View>
      <Text>Statistiques :</Text>
      <Text>{JSON.stringify(progress, null, 2)}</Text>
    </View>
  );
}
