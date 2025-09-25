// Configuration Firebase centralisée
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore, doc, setDoc, updateDoc, increment, serverTimestamp, onSnapshot, collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyDSDK0NfVSs_VQb3TnrixiJbOpTsmoUMvU",
    authDomain: "misterpips-b71fb.firebaseapp.com",
    projectId: "misterpips-b71fb",
    storageBucket: "misterpips-b71fb.firebasestorage.app",
    messagingSenderId: "574231126409",
    appId: "1:574231126409:web:b7ed93ac4ea62e247dc158"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Fonctions de sauvegarde en temps réel
export const FirebaseUtils = {
    // Sauvegarder des données
    async saveData(collection, data, docId = null) {
        try {
            const docRef = docId ? doc(db, collection, docId) : doc(collection(db, collection));
            await setDoc(docRef, {
                ...data,
                timestamp: serverTimestamp(),
                userId: auth.currentUser?.email || 'anonymous'
            });
            return docRef.id;
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            throw error;
        }
    },

    // Ajouter à une collection
    async addToCollection(collectionName, data) {
        try {
            const docRef = await addDoc(collection(db, collectionName), {
                ...data,
                timestamp: serverTimestamp(),
                userId: auth.currentUser?.email || 'anonymous'
            });
            return docRef.id;
        } catch (error) {
            console.error('Erreur ajout:', error);
            throw error;
        }
    },

    // Mettre à jour les statistiques
    async updateStats(statName, incrementValue = 1) {
        try {
            const statsRef = doc(db, 'statistics', 'global');
            await updateDoc(statsRef, {
                [statName]: increment(incrementValue),
                lastUpdate: serverTimestamp()
            });
        } catch (error) {
            // Si le document n'existe pas, le créer
            await setDoc(doc(db, 'statistics', 'global'), {
                [statName]: incrementValue,
                lastUpdate: serverTimestamp()
            });
        }
    },

    // Écouter les changements en temps réel
    listenToDocument(collectionName, docId, callback) {
        return onSnapshot(doc(db, collectionName, docId), callback);
    },

    // Écouter une collection
    listenToCollection(collectionName, callback) {
        return onSnapshot(collection(db, collectionName), callback);
    },

    // Enregistrer une visite de page
    async trackPageVisit(pageName) {
        await this.addToCollection('page_visits', {
            page: pageName,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        });
        await this.updateStats('totalVisits');
        await this.updateStats(`${pageName}Visits`);
    },

    // Enregistrer un téléchargement d'ebook
    async trackEbookDownload() {
        await this.addToCollection('ebook_downloads', {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
        await this.updateStats('ebookDownloads');
    },

    // Enregistrer un accès VIP
    async trackVipAccess(userEmail) {
        await this.addToCollection('vip_access', {
            userEmail: userEmail,
            timestamp: new Date().toISOString()
        });
        await this.updateStats('vipAccess');
    }
};

// Initialiser le tracking automatique
document.addEventListener('DOMContentLoaded', () => {
    const pageName = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    FirebaseUtils.trackPageVisit(pageName);
});