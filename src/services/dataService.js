import {
    collection, doc, getDocs, getDoc,
    setDoc, updateDoc, onSnapshot, deleteDoc
} from 'firebase/firestore'
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth'
import { db, auth } from '../firebase.js'

import clientsJSON from '../data/clients.json'
import employesJSON from '../data/employes.json'
import missionsJSON from '../data/missions.json'

async function seedIfEmpty(collectionName, data) {
    const snap = await getDocs(collection(db, collectionName))
    if (!snap.empty) return
    for (const item of data) {
        await setDoc(doc(db, collectionName, String(item.id)), item)
    }
}

export async function initData() {
    await seedIfEmpty('clients', clientsJSON)
    await seedIfEmpty('employes', employesJSON)
    await seedIfEmpty('missions', missionsJSON)
}

export async function getClients() {
    const snap = await getDocs(collection(db, 'clients'))
    if (snap.empty) return clientsJSON
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getEmployes() {
    const snap = await getDocs(collection(db, 'employes'))
    if (snap.empty) return employesJSON
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getMissions() {
    const snap = await getDocs(collection(db, 'missions'))
    if (snap.empty) return missionsJSON
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getProspects() {
    const snap = await getDocs(collection(db, 'prospects'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function setProspect(id, data) {
    await setDoc(doc(db, 'prospects', String(id)), data)
}

export async function deleteProspect(id) {
    await deleteDoc(doc(db, 'prospects', String(id)))
}

export async function updateClient(id, data) {
    await setDoc(doc(db, 'clients', String(id)), data, { merge: true })
}

export async function deleteClient(id) {
    await deleteDoc(doc(db, 'clients', String(id)))
}

export async function updateMission(id, data) {
    await setDoc(doc(db, 'missions', String(id)), data, { merge: true })
}

export async function setClientExtra(id, champ, valeur) {
    const ref = doc(db, 'clients_extra', String(id))
    await setDoc(ref, { [champ]: valeur }, { merge: true })
}

export async function getClientExtra(id) {
    const ref = doc(db, 'clients_extra', String(id))
    const snap = await getDoc(ref)
    return snap.exists() ? snap.data() : {}
}

export async function setMissionExtra(id, champ, valeur) {
    const ref = doc(db, 'missions_extra', String(id))
    await setDoc(ref, { [champ]: valeur }, { merge: true })
}

export async function getMissionExtra(id) {
    const ref = doc(db, 'missions_extra', String(id))
    const snap = await getDoc(ref)
    return snap.exists() ? snap.data() : {}
}

export async function setCharges(data) {
    await setDoc(doc(db, 'charges', 'global'), data)
}

export async function getCharges() {
    const snap = await getDoc(doc(db, 'charges', 'global'))
    return snap.exists() ? snap.data() : {}
}

export function subscribeToClients(callback) {
    return onSnapshot(collection(db, 'clients'), snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
}

export function subscribeToMissions(callback) {
    return onSnapshot(collection(db, 'missions'), snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
}

export function subscribeToEmployes(callback) {
    return onSnapshot(collection(db, 'employes'), snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
}

export function subscribeToProspects(callback) {
    return onSnapshot(collection(db, 'prospects'), snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
}

export async function loginUser(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid))
    const role = userDoc.exists() ? userDoc.data().role : 'consultant'
    return { uid: cred.user.uid, email: cred.user.email, role }
}

export async function logoutUser() {
    await signOut(auth)
}

export function onAuthChange(callback) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) { callback(null); return }
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        const role = userDoc.exists() ? userDoc.data().role : 'consultant'
        callback({ uid: firebaseUser.uid, email: firebaseUser.email, role })
    })
}