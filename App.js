import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, SafeAreaView, Alert } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, updateDoc, writeBatch, setDoc } from 'firebase/firestore';

// Vos clés Firebase officielles intégrées
const firebaseConfig = {
  apiKey: "AIzaSyABZs5PVed-nMAJG3ytFJ11XwCV-cyPuKs",
  authDomain: "planningfamille-a63ff.firebaseapp.com",
  projectId: "planningfamille-a63ff",
  storageBucket: "planningfamille-a63ff.firebasestorage.app",
  messagingSenderId: "287840011329",
  appId: "1:287840011329:web:e5804532f42faa988432c0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [taches, setTaches] = useState([]);
  const [utilisateur, setUtilisateur] = useState("Chef"); // À modifier sur chaque iPhone (ex: Papa, Maman)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "planning"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTaches(data.sort((a, b) => a.ordre - b.ordre));
    });
    return () => unsubscribe();
  }, []);

  const sInscrire = async (idTache) => {
    const ref = doc(db, "planning", idTache);
    await updateDoc(ref, { responsable: utilisateur });
  };

  const resetSemaine = async () => {
    const batch = writeBatch(db);
    taches.forEach(t => batch.update(doc(db, "planning", t.id), { responsable: "" }));
    await batch.commit();
    Alert.alert("Succès", "La semaine a été remise à zéro !");
  };

  const initPlanning = async () => {
    const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    const missions = ["Vaisselle", "Cuisine", "Ménage", "Courses"];
    
    for (let i = 0; i < jours.length; i++) {
      for (let j = 0; j < missions.length; j++) {
        const id = `${jours[i]}-${missions[j]}`;
        await setDoc(doc(db, "planning", id), {
          jour: jours[i],
          mission: missions[j],
          responsable: "",
          ordre: i * 10 + j
        });
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titre}>🏠 Planning de la Brigade</Text>
      <Text style={styles.sousTitre}>Connecté en tant que : {utilisateur}</Text>

      {taches.length === 0 ? (
        <TouchableOpacity style={styles.btnInit} onPress={initPlanning}>
          <Text style={styles.btnText}>Générer le planning de base</Text>
        </TouchableOpacity>
      ) : (
        <FlatList
          data={taches}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.jour}>{item.jour}</Text>
                <Text style={styles.mission}>{item.mission}</Text>
              </View>
              {item.responsable ? (
                <View style={[styles.badge, { backgroundColor: item.responsable === "Chef" ? "#3498db" : "#e67e22" }]}>
                  <Text style={styles.badgeText}>{item.responsable}</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.btn} onPress={() => sInscrire(item.id)}>
                  <Text style={styles.btnText}>Je prends !</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      {utilisateur === "Chef" && taches.length > 0 && (
        <TouchableOpacity style={styles.btnReset} onPress={resetSemaine}>
          <Text style={styles.btnText}>🔄 Reset du Dimanche</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 20 },
  titre: { fontSize: 26, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', marginTop: 20 },
  sousTitre: { textAlign: 'center', color: '#7f8c8d', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, elevation: 2 },
  jour: { fontSize: 14, color: '#95a5a6', fontWeight: 'bold' },
  mission: { fontSize: 18, color: '#2c3e50' },
  btn: { backgroundColor: '#2ecc71', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  btnReset: { backgroundColor: '#e74c3c', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnInit: { backgroundColor: '#f39c12', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 50 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  badge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
  badgeText: { color: '#fff', fontSize: 14, fontWeight: 'bold' }
});