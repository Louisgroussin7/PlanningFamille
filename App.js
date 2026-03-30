import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, SafeAreaView, Alert, TextInput } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, updateDoc, writeBatch, setDoc } from 'firebase/firestore';

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
  const [utilisateur, setUtilisateur] = useState("Louis");
  
  const [motDePasse, setMotDePasse] = useState("");
  const [estAuthentifie, setEstAuthentifie] = useState(false);
  const CODE_SECRET = "LouisCamille78540!!"; // ⬅️ METTEZ VOTRE CODE ICI

  // La Famille Groussin
  const membres = ["Louis", "Stéphane", "Céline", "Camille"]; 

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "planning"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTaches(data.sort((a, b) => a.ordre - b.ordre));
    });
    return () => unsubscribe();
  }, []);

  const changerUtilisateur = (nom) => {
    setUtilisateur(nom);
    if (nom !== "Louis") {
      setEstAuthentifie(false);
      setMotDePasse("");
    }
  };

  const verifierCode = () => {
    if (motDePasse === CODE_SECRET) {
      setEstAuthentifie(true);
    } else {
      Alert.alert("Erreur", "Mauvais mot de passe !");
      setMotDePasse("");
    }
  };

  const sInscrire = async (idTache) => {
    if (utilisateur === "Louis" && !estAuthentifie) {
      Alert.alert("Verrouillé", "Entrez votre mot de passe pour prendre une tâche.");
      return;
    }
    const ref = doc(db, "planning", idTache);
    await updateDoc(ref, { responsable: utilisateur });
  };

  const resetSemaine = async () => {
    const batch = writeBatch(db);
    taches.forEach(t => batch.update(doc(db, "planning", t.id), { responsable: "" }));
    await batch.commit();
    Alert.alert("Succès", "Le planning a été remis à zéro !");
  };

  const initPlanning = async () => {
    const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    const missionsQuotidiennes = ["Vaisselle", "Cuisine", "Ménage"];
    let ordre = 0;
    for (let i = 0; i < jours.length; i++) {
      for (let j = 0; j < missionsQuotidiennes.length; j++) {
        const id = `${jours[i]}-${missionsQuotidiennes[j]}`;
        await setDoc(doc(db, "planning", id), { jour: jours[i], mission: missionsQuotidiennes[j], responsable: "", ordre: ordre });
        ordre++;
      }
      if (jours[i] === "Samedi") {
        const id = `${jours[i]}-Courses`;
        await setDoc(doc(db, "planning", id), { jour: jours[i], mission: "Courses", responsable: "", ordre: ordre });
        ordre++;
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titre}>🏠 Planning de la Famille Groussin</Text>

      <View style={styles.selecteurContainer}>
        <Text style={styles.selecteurTexte}>Qui êtes-vous ?</Text>
        <View style={styles.boutonsMembres}>
          {membres.map(m => (
            <TouchableOpacity 
              key={m} 
              style={[styles.btnMembre, utilisateur === m && styles.btnMembreActif]}
              onPress={() => changerUtilisateur(m)}
            >
              <Text style={[styles.txtMembre, utilisateur === m && styles.txtMembreActif]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {utilisateur === "Louis" && !estAuthentifie && (
          <View style={styles.loginBox}>
            <TextInput 
              style={styles.input} 
              placeholder="Code secret..." 
              secureTextEntry={true} 
              value={motDePasse}
              onChangeText={setMotDePasse}
            />
            <TouchableOpacity style={styles.btnValider} onPress={verifierCode}>
              <Text style={styles.btnText}>OK</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

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
                <View style={[styles.badge, { backgroundColor: item.responsable === "Louis" ? "#3498db" : "#e67e22" }]}>
                  <Text style={styles.badgeText}>{item.responsable}</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.btn, (utilisateur === "Louis" && !estAuthentifie) ? {backgroundColor: '#bdc3c7'} : {}]} 
                  onPress={() => sInscrire(item.id)}
                >
                  <Text style={styles.btnText}>Prendre</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      {utilisateur === "Louis" && estAuthentifie && taches.length > 0 && (
        <TouchableOpacity style={styles.btnReset} onPress={resetSemaine}>
          <Text style={styles.btnText}>🔄 Reset du Dimanche</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 20 },
  titre: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', marginTop: 20, marginBottom: 10 },
  selecteurContainer: { backgroundColor: '#fff', padding: 10, borderRadius: 12, marginBottom: 15, elevation: 2 },
  selecteurTexte: { textAlign: 'center', color: '#7f8c8d', marginBottom: 8, fontWeight: 'bold' },
  boutonsMembres: { flexDirection: 'row', justifyContent: 'space-around' },
  btnMembre: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: '#ecf0f1' },
  btnMembreActif: { backgroundColor: '#34495e' },
  txtMembre: { color: '#7f8c8d', fontWeight: 'bold', fontSize: 12 },
  txtMembreActif: { color: '#fff' },
  loginBox: { flexDirection: 'row', marginTop: 15, justifyContent: 'center', alignItems: 'center' },
  input: { backgroundColor: '#f0f2f5', padding: 8, borderRadius: 8, flex: 1, marginRight: 10, borderBottomWidth: 2, borderColor: '#3498db' },
  btnValider: { backgroundColor: '#3498db', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, elevation: 2 },
  jour: { fontSize: 12, color: '#95a5a6', fontWeight: 'bold' },
  mission: { fontSize: 16, color: '#2c3e50' },
  btn: { backgroundColor: '#2ecc71', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnReset: { backgroundColor: '#e74c3c', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnInit: { backgroundColor: '#f39c12', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 50 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  badge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 15 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});