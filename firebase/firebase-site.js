import { initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp
} from 'firebase/firestore/lite';

const config = window.AJAY_NXT_FIREBASE_CONFIG;
const configured = Boolean(config?.apiKey && config?.authDomain && config?.projectId && config?.appId);

const clean = (value, max = 500) => String(value ?? '').trim().slice(0, max);

if (!configured) {
  window.AJAY_NXT_FIREBASE = {
    configured: false,
    saveEnquiry: async () => ({ saved: false, reason: 'not-configured' }),
    track: async () => false
  };
  window.dispatchEvent(new CustomEvent('ajaynxt:firebase-ready'));
} else {
  const app = initializeApp(config);
  const db = getFirestore(app);
  const sessionKey = 'ajaynxt-session-id';
  let sessionId = sessionStorage.getItem(sessionKey);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(sessionKey, sessionId);
  }

  async function loadPublicContent() {
    try {
      const snapshot = await getDoc(doc(db, 'site', 'public'));
      if (!snapshot.exists()) return null;
      const content = snapshot.data();
      window.AJAY_NXT_REMOTE_CONTENT = content;
      window.dispatchEvent(new CustomEvent('ajaynxt:content-ready', { detail: content }));
      return content;
    } catch (error) {
      console.warn('AJAY NXT content fallback active.', error);
      return null;
    }
  }

  async function saveEnquiry(input) {
    const payload = {
      name: clean(input.name, 100),
      email: clean(input.email, 160),
      phone: clean(input.phone, 40),
      service: clean(input.service, 100),
      timeline: clean(input.timeline, 80),
      budget: clean(input.budget, 80),
      budgetInr: clean(input.budgetInr, 80),
      details: clean(input.details, 1500),
      source: 'ajaynxt.com',
      status: 'new',
      createdAt: serverTimestamp()
    };

    if (payload.name.length < 2 || payload.phone.length < 6 || payload.details.length < 5) {
      throw new Error('Please complete the required enquiry details.');
    }

    const reference = await addDoc(collection(db, 'enquiries'), payload);
    return { saved: true, id: reference.id };
  }

  async function track(eventName, path = window.location.pathname) {
    const event = clean(eventName, 60);
    if (!event) return false;

    try {
      await addDoc(collection(db, 'analytics_events'), {
        event,
        path: clean(path, 180),
        session: clean(sessionId, 60),
        source: 'ajaynxt.com',
        createdAt: serverTimestamp()
      });
      return true;
    } catch {
      return false;
    }
  }

  window.AJAY_NXT_FIREBASE = {
    configured: true,
    loadPublicContent,
    saveEnquiry,
    track
  };

  window.dispatchEvent(new CustomEvent('ajaynxt:firebase-ready'));
  loadPublicContent();
}
