import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';

const ADMIN_EMAIL = 'ajayx3neha@gmail.com';
const config = window.AJAY_NXT_FIREBASE_CONFIG;
const defaults = structuredClone(window.AJAY_NXT_DEFAULT_CONTENT || {});
const configured = Boolean(config?.apiKey && config?.authDomain && config?.projectId && config?.appId);

const loginPanel = document.querySelector('[data-login-panel]');
const dashboard = document.querySelector('[data-dashboard]');
const loginButton = document.querySelector('[data-google-login]');
const signOutButton = document.querySelector('[data-sign-out]');
const authStatus = document.querySelector('[data-auth-status]');
const saveStatus = document.querySelector('[data-save-status]');
const liveStatus = saveStatus?.closest('.live-status');
const contentForm = document.querySelector('[data-content-form]');
const projectEditors = document.querySelector('[data-project-editors]');
const collaborationEditors = document.querySelector('[data-collaboration-editors]');
const collaborationCount = document.querySelector('[data-collaboration-count]');
const reviewEditors = document.querySelector('[data-review-editors]');
const reviewCount = document.querySelector('[data-review-count]');
const enquiryList = document.querySelector('[data-enquiry-list]');
const enquiriesEmpty = document.querySelector('[data-enquiries-empty]');
const enquiryCount = document.querySelector('[data-enquiry-count]');
const metricGrid = document.querySelector('[data-metric-grid]');

let content = structuredClone(defaults);
let auth;
let db;

const clean = (value, max = 1500) => String(value ?? '').trim().slice(0, max);
const clone = (value) => structuredClone(value);

function setStatus(message, state = 'saved') {
  if (!saveStatus) return;
  saveStatus.textContent = message;
  liveStatus?.classList.toggle('is-busy', state === 'busy');
  liveStatus?.classList.toggle('is-error', state === 'error');
}

function mergeDeep(target, source) {
  if (!source || typeof source !== 'object') return target;
  Object.entries(source).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = mergeDeep(target[key] || {}, value);
    } else {
      target[key] = value;
    }
  });
  return target;
}

function valueAt(object, path) {
  return path.split('.').reduce((value, key) => value?.[key], object);
}

function setAt(object, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const parent = keys.reduce((item, key) => {
    item[key] ||= {};
    return item[key];
  }, object);
  parent[last] = value;
}

function hydrateContentForm() {
  contentForm?.querySelectorAll('[name]').forEach((field) => {
    field.value = valueAt(content, field.name) ?? '';
  });
}

function collectContentForm() {
  const next = clone(content);
  contentForm?.querySelectorAll('[name]').forEach((field) => {
    setAt(next, field.name, clean(field.value, field.tagName === 'TEXTAREA' ? 1500 : 300));
  });
  return next;
}

const projectOrder = ['diamond', 'rajmahal', 'moveToGo'];

function renderProjectEditors() {
  if (!projectEditors) return;
  projectEditors.innerHTML = projectOrder.map((key) => {
    const project = content.projects?.[key] || defaults.projects[key];
    return `
      <article class="project-editor" data-project-editor="${key}">
        <h3>${project.title}</h3>
        <small>${key}</small>
        <label>Title<input data-project-field="title" maxlength="100" value="${escapeHtml(project.title)}"/></label>
        <label>Eyebrow<input data-project-field="eyebrow" maxlength="120" value="${escapeHtml(project.eyebrow)}"/></label>
        <label>Summary<textarea data-project-field="summary" maxlength="350" rows="3">${escapeHtml(project.summary)}</textarea></label>
        <label>Challenge<textarea data-project-field="challenge" maxlength="700" rows="4">${escapeHtml(project.challenge)}</textarea></label>
        <label>Solution<textarea data-project-field="solution" maxlength="700" rows="4">${escapeHtml(project.solution)}</textarea></label>
        <label>Result<textarea data-project-field="result" maxlength="700" rows="4">${escapeHtml(project.result)}</textarea></label>
        <label>Services — comma separated<input data-project-field="services" maxlength="300" value="${escapeHtml((project.services || []).join(', '))}"/></label>
        <label>Live URL<input data-project-field="url" type="url" value="${escapeHtml(project.url || '')}"/></label>
      </article>
    `;
  }).join('');
}

function collectProjects() {
  const projects = clone(content.projects || {});
  projectEditors?.querySelectorAll('[data-project-editor]').forEach((editor) => {
    const key = editor.dataset.projectEditor;
    const next = {};
    editor.querySelectorAll('[data-project-field]').forEach((field) => {
      const name = field.dataset.projectField;
      next[name] = name === 'services'
        ? clean(field.value, 300).split(',').map((item) => item.trim()).filter(Boolean).slice(0, 8)
        : clean(field.value, 700);
    });
    projects[key] = next;
  });
  return projects;
}

function normaliseCollaborations(source = content) {
  return (Array.isArray(source.collaborations) ? source.collaborations : []).map((item, index) => ({
    id: clean(item.id || `collaboration-${index + 1}`, 80),
    kicker: clean(item.kicker, 100),
    title: clean(item.title, 100),
    highlight: clean(item.highlight, 100),
    summary: clean(item.summary, 500),
    image: clean(item.image, 500),
    imageAlt: clean(item.imageAlt, 160),
    roles: Array.isArray(item.roles) ? item.roles.map((role) => clean(role, 60)).filter(Boolean).slice(0, 8) : [],
    website: clean(item.website, 500),
    googleBusiness: clean(item.googleBusiness, 500),
    instagram: clean(item.instagram, 500),
    facebook: clean(item.facebook, 500),
    published: item.published !== false
  }));
}

function previewUrl(value) {
  try {
    return new URL(String(value || ''), new URL('../', window.location.href)).href;
  } catch {
    return '../assets/ajay-nxt-orange-mark.png';
  }
}

function renderCollaborationEditors() {
  if (!collaborationEditors) return;
  const collaborations = normaliseCollaborations();
  if (collaborationCount) collaborationCount.textContent = String(collaborations.length);
  collaborationEditors.innerHTML = collaborations.map((item, index) => `
    <article class="collaboration-editor" data-collaboration-editor="${escapeHtml(item.id)}">
      <div class="collaboration-preview">
        <img alt="" data-collaboration-preview src="${escapeHtml(previewUrl(item.image))}"/>
      </div>
      <div class="collaboration-editor-body">
        <div class="review-editor-head">
          <div><small>Collaboration ${index + 1}</small><h3>${escapeHtml(item.title || 'New collaboration')}</h3></div>
          <button class="danger-button" data-delete-collaboration type="button">Delete</button>
        </div>
        <label class="toggle-row review-publish">
          <span><strong>Published</strong><small>Show this collaboration on the public website.</small></span>
          <input data-collaboration-field="published" type="checkbox" ${item.published ? 'checked' : ''}/>
        </label>
        <label>Visual / photo URL or local path<input data-collaboration-field="image" maxlength="500" value="${escapeHtml(item.image)}"/></label>
        <label>Image description<input data-collaboration-field="imageAlt" maxlength="160" value="${escapeHtml(item.imageAlt)}"/></label>
        <div class="two-fields">
          <label>Small label<input data-collaboration-field="kicker" maxlength="100" value="${escapeHtml(item.kicker)}"/></label>
          <label>Heading<input data-collaboration-field="title" maxlength="100" value="${escapeHtml(item.title)}"/></label>
        </div>
        <label>Highlighted heading text<input data-collaboration-field="highlight" maxlength="100" value="${escapeHtml(item.highlight)}"/></label>
        <label>Short description<textarea data-collaboration-field="summary" maxlength="500" rows="4">${escapeHtml(item.summary)}</textarea></label>
        <label>Roles — comma separated<input data-collaboration-field="roles" maxlength="400" value="${escapeHtml(item.roles.join(', '))}"/></label>
        <div class="two-fields">
          <label>Website<input data-collaboration-field="website" type="url" value="${escapeHtml(item.website)}"/></label>
          <label>Google Business<input data-collaboration-field="googleBusiness" type="url" value="${escapeHtml(item.googleBusiness)}"/></label>
        </div>
        <div class="two-fields">
          <label>Instagram<input data-collaboration-field="instagram" type="url" value="${escapeHtml(item.instagram)}"/></label>
          <label>Facebook<input data-collaboration-field="facebook" type="url" value="${escapeHtml(item.facebook)}"/></label>
        </div>
      </div>
    </article>
  `).join('');
}

function collectCollaborations() {
  return [...(collaborationEditors?.querySelectorAll('[data-collaboration-editor]') || [])].map((editor, index) => {
    const item = { id: clean(editor.dataset.collaborationEditor || `collaboration-${index + 1}`, 80) };
    editor.querySelectorAll('[data-collaboration-field]').forEach((field) => {
      const name = field.dataset.collaborationField;
      if (name === 'published') item[name] = field.checked;
      else if (name === 'roles') {
        item[name] = clean(field.value, 400).split(',').map((role) => role.trim()).filter(Boolean).slice(0, 8);
      } else item[name] = clean(field.value, name === 'summary' ? 500 : 500);
    });
    return item;
  }).filter((item) => item.title || item.summary || item.image);
}

function normaliseReviews(source = content) {
  const items = Array.isArray(source.reviews) && source.reviews.length
    ? source.reviews
    : (source.review ? [source.review] : []);

  return items.map((item, index) => ({
    id: clean(item.id || `review-${index + 1}`, 80),
    label: clean(item.label, 80),
    quote: clean(item.quote, 600),
    name: clean(item.name, 80),
    company: clean(item.company, 100),
    rating: clean(item.rating || '5.0', 8),
    proofUrl: clean(item.proofUrl, 500),
    proofLabel: clean(item.proofLabel || 'View project', 40),
    published: item.published !== false
  }));
}

function renderReviewEditors() {
  if (!reviewEditors) return;
  const reviews = normaliseReviews();
  if (reviewCount) reviewCount.textContent = String(reviews.length);
  reviewEditors.innerHTML = reviews.map((review, index) => `
    <article class="review-editor" data-review-editor="${escapeHtml(review.id)}">
      <div class="review-editor-head">
        <div><small>Review ${index + 1}</small><h3>${escapeHtml(review.name || 'New review')}</h3></div>
        <button class="danger-button" data-delete-review type="button">Delete</button>
      </div>
      <label class="toggle-row review-publish">
        <span><strong>Published</strong><small>Show this review on the public website.</small></span>
        <input data-review-field="published" type="checkbox" ${review.published ? 'checked' : ''}/>
      </label>
      <div class="two-fields">
        <label>Client name<input data-review-field="name" maxlength="80" value="${escapeHtml(review.name)}"/></label>
        <label>Rating<input data-review-field="rating" inputmode="decimal" maxlength="8" value="${escapeHtml(review.rating)}"/></label>
      </div>
      <div class="two-fields">
        <label>Company<input data-review-field="company" maxlength="100" value="${escapeHtml(review.company)}"/></label>
        <label>Small label<input data-review-field="label" maxlength="80" value="${escapeHtml(review.label)}"/></label>
      </div>
      <label>Review<textarea data-review-field="quote" maxlength="600" rows="5">${escapeHtml(review.quote)}</textarea></label>
      <label>Proof / project URL<input data-review-field="proofUrl" type="url" value="${escapeHtml(review.proofUrl)}"/></label>
      <label>Proof button text<input data-review-field="proofLabel" maxlength="40" value="${escapeHtml(review.proofLabel)}"/></label>
    </article>
  `).join('');
}

function collectReviews() {
  return [...(reviewEditors?.querySelectorAll('[data-review-editor]') || [])].map((editor, index) => {
    const item = { id: clean(editor.dataset.reviewEditor || `review-${index + 1}`, 80) };
    editor.querySelectorAll('[data-review-field]').forEach((field) => {
      const name = field.dataset.reviewField;
      item[name] = name === 'published' ? field.checked : clean(field.value, name === 'quote' ? 600 : 500);
    });
    return item;
  }).filter((item) => item.name || item.quote);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

async function loadContent() {
  const snapshot = await getDoc(doc(db, 'site', 'public'));
  const remote = snapshot.exists() ? snapshot.data() : {};
  content = mergeDeep(clone(defaults), remote);
  if (!Array.isArray(remote.reviews) && remote.review) content.reviews = [clone(content.review)];
  hydrateContentForm();
  renderProjectEditors();
  renderCollaborationEditors();
  renderReviewEditors();
  const rotation = document.querySelector('[data-setting-rotation]');
  const delay = document.querySelector('[data-setting-delay]');
  if (rotation) rotation.checked = content.settings?.paletteRotationEnabled !== false;
  if (delay) delay.value = Math.max(5, Number(content.settings?.paletteDelayMs || 5000) / 1000);
}

async function saveContent(next, message) {
  setStatus('Saving…', 'busy');
  await setDoc(doc(db, 'site', 'public'), {
    ...next,
    updatedAt: serverTimestamp(),
    updatedBy: ADMIN_EMAIL
  });
  content = next;
  setStatus(message);
}

function formatDate(timestamp) {
  const date = timestamp?.toDate?.();
  return date ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date) : 'Just now';
}

async function loadEnquiries() {
  setStatus('Loading enquiries…', 'busy');
  const snapshot = await getDocs(query(collection(db, 'enquiries'), orderBy('createdAt', 'desc'), limit(100)));
  const enquiries = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  if (enquiryCount) enquiryCount.textContent = String(enquiries.length);
  if (enquiriesEmpty) enquiriesEmpty.hidden = enquiries.length > 0;
  if (enquiryList) {
    enquiryList.innerHTML = enquiries.map((item) => `
      <article class="enquiry-card" data-enquiry-id="${item.id}">
        <div class="enquiry-head">
          <div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.email || 'No email')} · ${escapeHtml(item.phone)}</p></div>
          <small>${escapeHtml(formatDate(item.createdAt))}</small>
        </div>
        <div class="enquiry-meta">
          <span>${escapeHtml(item.service || 'Service not selected')}</span>
          <span>${escapeHtml(item.timeline || 'Timeline open')}</span>
          <span>${escapeHtml(item.budget || 'Budget not specified')}</span>
        </div>
        <p>${escapeHtml(item.details)}</p>
        <div class="enquiry-actions">
          <label>Status
            <select data-enquiry-status>
              ${['new', 'contacted', 'confirmed', 'in-progress', 'completed', 'declined'].map((status) =>
                `<option value="${status}" ${item.status === status ? 'selected' : ''}>${status}</option>`
              ).join('')}
            </select>
          </label>
          <a class="quiet-button" href="mailto:${encodeURIComponent(item.email || '')}">Email</a>
          <button class="danger-button" data-delete-enquiry type="button">Delete</button>
        </div>
      </article>
    `).join('');
  }
  setStatus('Enquiries synced');
}

async function loadAnalytics() {
  setStatus('Loading analytics…', 'busy');
  const snapshot = await getDocs(query(collection(db, 'analytics_events'), orderBy('createdAt', 'desc'), limit(500)));
  const counts = {};
  snapshot.forEach((item) => {
    const event = item.data().event || 'other';
    counts[event] = (counts[event] || 0) + 1;
  });
  const labels = {
    book_submit: 'Booking submits',
    whatsapp_click: 'WhatsApp clicks',
    case_study_open: 'Case studies',
    project_live_click: 'Live project clicks',
    instagram_click: 'Instagram clicks',
    linkedin_click: 'LinkedIn clicks',
    palette_lock: 'Palette locks'
  };
  const items = Object.entries(labels).map(([event, label]) => ({ event, label, count: counts[event] || 0 }));
  if (metricGrid) {
    metricGrid.innerHTML = items.map((item) => `
      <article class="metric-card"><strong>${item.count}</strong><span>${item.label}</span></article>
    `).join('');
  }
  setStatus('Analytics synced');
}

function showDashboard(user) {
  const allowed = user?.email?.toLowerCase() === ADMIN_EMAIL && user.emailVerified;
  loginPanel.hidden = allowed;
  dashboard.hidden = !allowed;
  signOutButton.hidden = !allowed;
  if (allowed) {
    loadContent().then(() => Promise.all([loadEnquiries(), loadAnalytics()])).catch((error) => {
      setStatus(error.message || 'Could not load dashboard.', 'error');
    });
  }
}

document.querySelectorAll('[data-admin-tab]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-admin-tab]').forEach((item) => item.classList.toggle('is-active', item === button));
    document.querySelectorAll('[data-admin-panel]').forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.adminPanel === button.dataset.adminTab);
    });
  });
});

contentForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await saveContent(collectContentForm(), 'Content saved');
  } catch (error) {
    setStatus(error.message || 'Content could not be saved.', 'error');
  }
});

document.querySelector('[data-save-projects]')?.addEventListener('click', async () => {
  try {
    const next = clone(content);
    next.projects = collectProjects();
    await saveContent(next, 'Case studies saved');
  } catch (error) {
    setStatus(error.message || 'Case studies could not be saved.', 'error');
  }
});

document.querySelector('[data-add-review]')?.addEventListener('click', () => {
  const next = clone(content);
  next.reviews = collectReviews();
  next.reviews.push({
    id: `review-${Date.now()}`,
    label: '',
    quote: '',
    name: '',
    company: '',
    rating: '5.0',
    proofUrl: '',
    proofLabel: 'View project',
    published: true
  });
  content = next;
  renderReviewEditors();
  reviewEditors?.querySelector('[data-review-editor]:last-child input[data-review-field="name"]')?.focus();
  setStatus('New review ready — save when complete');
});

document.querySelector('[data-save-reviews]')?.addEventListener('click', async () => {
  try {
    const next = clone(content);
    next.reviews = collectReviews();
    next.review = clone(next.reviews.find((item) => item.published) || next.reviews[0] || defaults.review);
    await saveContent(next, 'Reviews saved');
    renderReviewEditors();
  } catch (error) {
    setStatus(error.message || 'Reviews could not be saved.', 'error');
  }
});

document.querySelector('[data-add-collaboration]')?.addEventListener('click', () => {
  const next = clone(content);
  next.collaborations = collectCollaborations();
  next.collaborations.push({
    id: `collaboration-${Date.now()}`,
    kicker: '',
    title: '',
    highlight: '',
    summary: '',
    image: '',
    imageAlt: '',
    roles: [],
    website: '',
    googleBusiness: '',
    instagram: '',
    facebook: '',
    published: true
  });
  content = next;
  renderCollaborationEditors();
  collaborationEditors?.querySelector('[data-collaboration-editor]:last-child input[data-collaboration-field="title"]')?.focus();
  setStatus('New collaboration ready — save when complete');
});

document.querySelector('[data-save-collaborations]')?.addEventListener('click', async () => {
  try {
    const next = clone(content);
    next.collaborations = collectCollaborations();
    await saveContent(next, 'Collaborations saved');
    renderCollaborationEditors();
  } catch (error) {
    setStatus(error.message || 'Collaborations could not be saved.', 'error');
  }
});

collaborationEditors?.addEventListener('input', (event) => {
  const field = event.target.closest('[data-collaboration-field="image"]');
  if (!field) return;
  const preview = field.closest('[data-collaboration-editor]')?.querySelector('[data-collaboration-preview]');
  if (preview) preview.src = previewUrl(field.value);
});

collaborationEditors?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete-collaboration]');
  if (!button) return;
  const editor = button.closest('[data-collaboration-editor]');
  if (!window.confirm('Delete this collaboration? Save collaborations to publish the change.')) return;
  const next = clone(content);
  next.collaborations = collectCollaborations().filter((item) => item.id !== editor.dataset.collaborationEditor);
  content = next;
  renderCollaborationEditors();
  setStatus('Collaboration removed — save to publish');
});

reviewEditors?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete-review]');
  if (!button) return;
  const editor = button.closest('[data-review-editor]');
  if (!window.confirm('Delete this review? Save reviews to publish the change.')) return;
  const next = clone(content);
  next.reviews = collectReviews().filter((item) => item.id !== editor.dataset.reviewEditor);
  content = next;
  renderReviewEditors();
  setStatus('Review removed — save to publish');
});

document.querySelector('[data-save-settings]')?.addEventListener('click', async () => {
  try {
    const next = clone(content);
    next.settings = {
      paletteRotationEnabled: document.querySelector('[data-setting-rotation]')?.checked !== false,
      paletteDelayMs: Math.max(5, Number(document.querySelector('[data-setting-delay]')?.value || 5)) * 1000
    };
    await saveContent(next, 'Settings saved');
  } catch (error) {
    setStatus(error.message || 'Settings could not be saved.', 'error');
  }
});

document.querySelector('[data-reset-content]')?.addEventListener('click', async () => {
  if (!window.confirm('Restore the original AJAY NXT text and settings?')) return;
  try {
    await saveContent(clone(defaults), 'Defaults restored');
    await loadContent();
  } catch (error) {
    setStatus(error.message || 'Defaults could not be restored.', 'error');
  }
});

document.querySelector('[data-refresh-enquiries]')?.addEventListener('click', loadEnquiries);
document.querySelector('[data-refresh-analytics]')?.addEventListener('click', loadAnalytics);

enquiryList?.addEventListener('change', async (event) => {
  const select = event.target.closest('[data-enquiry-status]');
  if (!select) return;
  const card = select.closest('[data-enquiry-id]');
  try {
    await updateDoc(doc(db, 'enquiries', card.dataset.enquiryId), {
      status: select.value,
      updatedAt: serverTimestamp()
    });
    setStatus('Enquiry status saved');
  } catch (error) {
    setStatus(error.message || 'Status could not be saved.', 'error');
  }
});

enquiryList?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-delete-enquiry]');
  if (!button) return;
  const card = button.closest('[data-enquiry-id]');
  if (!window.confirm('Delete this enquiry permanently?')) return;
  try {
    await deleteDoc(doc(db, 'enquiries', card.dataset.enquiryId));
    await loadEnquiries();
  } catch (error) {
    setStatus(error.message || 'Enquiry could not be deleted.', 'error');
  }
});

if (!configured) {
  loginButton.disabled = true;
  authStatus.innerHTML = 'Firebase is not connected yet. Complete <code>firebase-config.js</code> to activate secure login.';
} else {
  const app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  setPersistence(auth, browserLocalPersistence);

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ login_hint: ADMIN_EMAIL, prompt: 'select_account' });

  loginButton.addEventListener('click', async () => {
    authStatus.textContent = 'Opening Google sign-in…';
    try {
      const result = await signInWithPopup(auth, provider);
      const allowed = result.user.email?.toLowerCase() === ADMIN_EMAIL && result.user.emailVerified;
      if (!allowed) {
        await signOut(auth);
        authStatus.textContent = 'Access denied. Use the verified AJAY NXT admin account.';
      }
    } catch (error) {
      authStatus.textContent = error.code === 'auth/popup-closed-by-user'
        ? 'Sign-in was cancelled.'
        : (error.message || 'Google sign-in failed.');
    }
  });

  signOutButton.addEventListener('click', () => signOut(auth));

  onAuthStateChanged(auth, async (user) => {
    if (user && (user.email?.toLowerCase() !== ADMIN_EMAIL || !user.emailVerified)) {
      await signOut(auth);
      authStatus.textContent = 'Access denied. This account is not the AJAY NXT admin.';
      return;
    }
    if (user) {
      authStatus.textContent = 'Secure account verified.';
      showDashboard(user);
    } else {
      showDashboard(null);
      authStatus.textContent = `Sign in with ${ADMIN_EMAIL}.`;
    }
  });
}
