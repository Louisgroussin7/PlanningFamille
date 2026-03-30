import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, SafeAreaView, Alert, TextInput } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, updateDoc, writeBatch, setDoc, arrayUnion } from 'firebase/firestore';

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

// --- NOUVEAU COMPOSANT : La carte des commentaires ---
const NoteCard = ({ item }) => {
  const [texteLocal, setTexteLocal] = useState(item.texte || "");

  useEffect(() => {
    setTexteLocal(item.texte || "");
  }, [item.texte]);

  const sauvegarderNote = async () => {
    const ref = doc(db, "planning", item.id);
    await updateDoc(ref, { texte: texteLocal });
  };

  return (
    <View style={styles.cardNote}>
      <Text style={styles.jour}>{item.jour}</Text>
      <Text style={styles.mission}>📝 Petits mots & Extras</Text>
      <View style={styles.noteContainer}>
        <TextInput
          style={styles.inputNote}
          value={texteLocal}
          onChangeText={setTexteLocal}
          placeholder="Ex: J'ai passé l'aspirateur..."
          multiline={true}
        />
        <TouchableOpacity style={styles.btnSaveNote} onPress={sauvegarderNote}>
          <Text style={styles.btnText}>Envoyer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
// ------------------------------------------------------

export default function App() {
  const [taches, setTaches] = useState([]);
  const [utilisateur, setUtilisateur] = useState("Louis");
  const [motDePasse, setMotDePasse] = useState("");
  const [estAuthentifie, setEstAuthentifie] = useState(false);
  const CODE_SECRET = "1234"; // ⬅️ VOTRE CODE ICI

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

  const sInscrire = async (tache) => {
    if (utilisateur === "Louis" && !estAuthentifie) {
      Alert.alert("Verrouillé", "Entrez votre mot de passe.");
      return;
    }
    if (tache.responsables.includes(utilisateur)) {
      Alert.alert("Info", "Vous êtes déjà inscrit à cette mission !");
      return;
    }
    const ref = doc(db, "planning", tache.id);
    await updateDoc(ref, { responsables: arrayUnion(utilisateur) });
  };

  const resetSemaine = async () => {
    const batch = writeBatch(db);
    taches.forEach(t => {
      if (t.mission === "Notes") {
        batch.update(doc(db, "planning", t.id), { texte: "" }); // Vide les commentaires
      } else {
        batch.update(doc(db, "planning", t.id), { responsables: [] }); // Vide les responsables
      }
    });
    await batch.commit();
    Alert.alert("Succès", "Le planning a été remis à zéro !");
  };

  const initPlanning = async () => {
    const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    const missionsQuotidiennes = ["Vaisselle", "Cuisine"];
    let ordre = 0;

    for (let i = 0; i < jours.length; i++) {
      for (let j = 0; j < missionsQuotidiennes.length; j++) {
        const id = `${jours[i]}-${missionsQuotidiennes[j]}`;
        await setDoc(doc(db, "planning", id), { jour: jours[i], mission: missionsQuotidiennes[j], responsables: [], limite: 1, ordre: ordre });
        ordre++;
      }

      if (jours[i] === "Samedi" || jours[i] === "Dimanche") {
        const id = `${jours[i]}-Ménage`;
        await setDoc(doc(db, "planning", id), { jour: jours[i], mission: "Ménage", responsables: [], limite: 2, ordre: ordre });
        ordre++;
      }

      if (jours[i] === "Samedi") {
        const id = `${jours[i]}-Courses`;
        await setDoc(doc(db, "planning", id), { jour: jours[i], mission: "Courses", responsables: [], limite: 2, ordre: ordre });
        ordre++;
      }

      // --- NOUVEAU : La case "Notes" à la fin de chaque journée ---
      const idNote = `${jours[i]}-Notes`;
      await setDoc(doc(db, "planning", idNote), { jour: jours[i], mission: "Notes", texte: "", ordre: ordre });
      ordre++;
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
              style={styles.inputLogin} 
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
          renderItem={({ item }) => {
            // Si c'est la case des notes, on affiche le composant NoteCard
            if (item.mission === "Notes") {
              return <NoteCard item={item} />;
            }

            // Sinon on affiche la carte de tâche normale
            return (
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jour}>{item.jour}</Text>
                  <Text style={styles.mission}>{item.mission}</Text>
                  <View style={styles.listeNoms}>
                    {item.responsables.map((nom, idx) => (
                      <View key={idx} style={[styles.badge, { backgroundColor: nom === "Louis" ? "#3498db" : "#e67e22" }]}>
                        <Text style={styles.badgeText}>{nom}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {item.responsables.length < item.limite ? (
                  <TouchableOpacity 
                    style={[styles.btn, (utilisateur === "Louis" && !estAuthentifie) ? {backgroundColor: '#bdc3c7'} : {}]} 
                    onPress={() => sInscrire(item)}
                  >
                    <Text style={styles.btnText}>Prendre ({item.limite - item.responsables.length})</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.complet}>
                    <Text style={styles.completText}>Complet ✅</Text>
                  </View>
                )}
              </View>
            );
          }}
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
  titre: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', marginTop: 20, marginBottom: 10 },
  selecteurContainer: { backgroundColor: '#fff', padding: 10, borderRadius: 12, marginBottom: 15, elevation: 2 },
  selecteurTexte: { textAlign: 'center', color: '#7f8c8d', marginBottom: 8, fontWeight: 'bold' },
  boutonsMembres: { flexDirection: 'row', justifyContent: 'space-around' },
  btnMembre: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: '#ecf0f1' },
  btnMembreActif: { backgroundColor: '#34495e' },
  txtMembre: { color: '#7f8c8d', fontWeight: 'bold', fontSize: 11 },
  txtMembreActif: { color: '#fff' },
  loginBox: { flexDirection: 'row', marginTop: 15, justifyContent: 'center', alignItems: 'center' },
  inputLogin: { backgroundColor: '#f0f2f5', padding: 8, borderRadius: 8, flex: 1, marginRight: 10, borderBottomWidth: 2, borderColor: '#3498db' },
  btnValider: { backgroundColor: '#3498db', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 },
  
  // Styles pour la carte normale
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, elevation: 2 },
  jour: { fontSize: 11, color: '#95a5a6', fontWeight: 'bold' },
  mission: { fontSize: 16, color: '#2c3e50', marginBottom: 5 },
  listeNoms: { flexDirection: 'row', flexWrap: 'wrap' },
  btn: { backgroundColor: '#2ecc71', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnReset: { backgroundColor: '#e74c3c', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnInit: { backgroundColor: '#f39c12', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 50 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10, marginRight: 5, marginTop: 2 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  complet: { padding: 8 },
  completText: { color: '#27ae60', fontWeight: 'bold', fontSize: 12 },

  // Styles pour la carte des Notes
  cardNote: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 8, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#f1c40f' },
  noteContainer: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  inputNote: { flex: 1, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ecf0f1', minHeight: 40 },
  btnSaveNote: { backgroundColor: '#34495e', padding: 10, borderRadius: 8, marginLeft: 10, justifyContent: 'center', alignItems: 'center' },
});