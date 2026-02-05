// scripts/dashboard.js

(function() {
  // Ensure Firebase is initialized
  const hasFirebase = typeof firebase !== 'undefined' && window.firebaseInitialized;

  document.addEventListener('DOMContentLoaded', () => {
    const isDashboard = !!document.getElementById('dashboardRoot');
    const isLogin = !!document.getElementById('loginRoot');

    if (!hasFirebase) {
      console.warn('[Firebase] SDK not detected; dashboard/login will be disabled.');
      return;
    }

    if (isLogin) initFirebaseLoginPage();
    if (isDashboard) initFirebaseDashboardPage();
  });

  // --------- LOGIN PAGE ---------
  function initFirebaseLoginPage() {
    const auth = window.firebaseAuth;
    const db = window.firebaseDb;

    if (!auth) return;

    // Redirect if already logged in and has org role
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const allowed = await userHasOrgAccess(db, user.uid);
        if (allowed) {
          window.location.href = './index.html';
        } else {
          setText(document.getElementById('loginMessage'), 'Your account does not have org access.', 'text-red-600');
        }
      }
    });

    const emailEl = document.getElementById('emailInput');
    const passEl = document.getElementById('passwordInput');
    const emailBtn = document.getElementById('emailLoginBtn');
    const googleBtn = document.getElementById('googleLoginBtn');
    const msg = document.getElementById('loginMessage');

    if (emailBtn) {
      emailBtn.addEventListener('click', async () => {
        const email = String(emailEl?.value || '').trim();
        const password = String(passEl?.value || '');
        if (!email || !password) {
          setText(msg, 'Email and password are required.', 'text-red-600');
          return;
        }
        try {
          await auth.signInWithEmailAndPassword(email, password);
          // onAuthStateChanged will handle redirect
        } catch (e) {
          setText(msg, e.message || 'Sign-in failed.', 'text-red-600');
        }
      });
    }

    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        try {
          const provider = new firebase.auth.GoogleAuthProvider();
          await auth.signInWithPopup(provider);
        } catch (e) {
          setText(msg, e.message || 'Google sign-in failed.', 'text-red-600');
        }
      });
    }
  }

  // --------- DASHBOARD PAGE ---------
  function initFirebaseDashboardPage() {
    const auth = window.firebaseAuth;
    const db = window.firebaseDb;
    const storage = window.firebaseStorage;

    if (!auth) return;

    const titleEl = document.getElementById('titleInput');
    const slugEl = document.getElementById('slugInput');
    const contentEl = document.getElementById('contentInput');
    const tagsEl = document.getElementById('tagsInput');
    const imageEl = document.getElementById('imageInput');
    const submitBtn = document.getElementById('submitButton');
    const formMsg = document.getElementById('formMessage');
    const signOutBtn = document.getElementById('signOutButton');

    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => auth.signOut().then(() => window.location.href = './login.html'));
    }

    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = './login.html';
        return;
      }

      const allowed = await userHasOrgAccess(db, user.uid);
      if (!allowed) {
        setText(formMsg, 'Your account does not have org access. Contact admin.', 'text-red-600');
        return;
      }

      // Bind submit for create
      if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
          const title = String(titleEl?.value || '').trim();
          const content = String(contentEl?.value || '').trim();
          const tags = String(tagsEl?.value || '')
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);
          let slug = String(slugEl?.value || '').trim();
          if (!title || !content) {
            setText(formMsg, 'Title and content are required.', 'text-red-600');
            return;
          }
          if (!slug) slug = slugify(title);

          try {
            const now = new Date();
            const docRef = db.collection('posts').doc();

            // Optional cover upload
            let coverUrl = '';
            const file = imageEl?.files && imageEl.files[0];
            if (file && storage) {
              const path = `posts/${user.uid}/${docRef.id}/${Date.now()}_${file.name}`;
              const ref = storage.ref().child(path);
              await ref.put(file);
              coverUrl = await ref.getDownloadURL();
            }

            await docRef.set({
              title,
              content,
              tags,
              slug,
              coverUrl: coverUrl || null,
              status: 'draft',
              authorId: user.uid,
              createdAt: firebase.firestore.Timestamp.fromDate(now),
              updatedAt: firebase.firestore.Timestamp.fromDate(now)
            });
            clearForm();
            setText(formMsg, 'Draft saved.', 'text-green-700');
          } catch (e) {
            setText(formMsg, e.message || 'Failed to save draft.', 'text-red-600');
          }
        });
      }

      // Live query of my posts
      db.collection('posts')
        .where('authorId', '==', user.uid)
        .orderBy('updatedAt', 'desc')
        .onSnapshot((snap) => {
          const items = [];
          snap.forEach(doc => items.push({ _id: doc.id, ...doc.data() }));
          renderPosts(items, db, user.uid);
        }, (err) => {
          console.error('Posts listener error', err);
        });
    });
  }

  // --------- Helpers ---------
  async function userHasOrgAccess(db, uid) {
    try {
      const doc = await db.collection('orgUsers').doc(uid).get();
      if (!doc.exists) return false;
      const role = doc.data()?.role;
      return role === 'OrgMember' || role === 'BlogAdmin';
    } catch {
      return false;
    }
  }

  function renderPosts(list, db, uid) {
    const container = document.getElementById('postsList');
    if (!container) return;

    if (!list.length) {
      container.innerHTML = '<p class="text-gray-600">No drafts yet.</p>';
      return;
    }

    container.innerHTML = list.map(item => renderCardHTML(item)).join('');

    list.forEach(item => {
      bindCardActions(item, db, uid);
    });
  }

  function bindCardActions(item, db, uid) {
    const editBtn = document.getElementById('edit-' + item._id);
    const delBtn = document.getElementById('del-' + item._id);
    const pubBtn = document.getElementById('pub-' + item._id);

    if (editBtn) editBtn.addEventListener('click', () => openEditor(item, db));
    if (delBtn) delBtn.addEventListener('click', async () => {
      try {
        await db.collection('posts').doc(item._id).delete();
      } catch (e) {
        console.error('Delete failed', e);
      }
    });
    if (pubBtn) pubBtn.addEventListener('click', async () => {
      try {
        await db.collection('posts').doc(item._id).update({ status: 'published', updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      } catch (e) {
        console.error('Publish failed', e);
      }
    });
  }

  function openEditor(item, db) {
    setValue('titleInput', item.title);
    setValue('slugInput', item.slug);
    setValue('contentInput', item.content);
    setValue('tagsInput', (item.tags || []).join(', '));

    const submitBtn = document.getElementById('submitButton');
    const formMsg = document.getElementById('formMessage');
    const imageEl = document.getElementById('imageInput');

    const handler = async () => {
      try {
        let coverUrl = item.coverUrl || null;
        const file = imageEl?.files && imageEl.files[0];
        if (file && window.firebaseStorage) {
          const path = `posts/${item.authorId || 'unknown'}/${item._id}/${Date.now()}_${file.name}`;
          const ref = window.firebaseStorage.ref().child(path);
          await ref.put(file);
          coverUrl = await ref.getDownloadURL();
        }

        await db.collection('posts').doc(item._id).update({
          title: String(document.getElementById('titleInput').value || '').trim(),
          slug: String(document.getElementById('slugInput').value || '').trim() || slugify(String(document.getElementById('titleInput').value || '')),
          content: String(document.getElementById('contentInput').value || '').trim(),
          tags: String(document.getElementById('tagsInput').value || '').split(',').map(t => t.trim()).filter(Boolean),
          coverUrl,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        submitBtn.textContent = 'Save Draft';
        setText(formMsg, 'Draft updated.', 'text-green-700');
        submitBtn.removeEventListener('click', handler);
      } catch (e) {
        setText(formMsg, e.message || 'Update failed.', 'text-red-600');
      }
    };

    submitBtn.textContent = 'Update Draft';
    // Replace button to drop previous listeners
    const newBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newBtn, submitBtn);
    newBtn.addEventListener('click', handler);
  }

  function renderCardHTML(item) {
    const tags = (item.tags || []).map(t => `<span class=\"inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded mr-2\">${escapeHtml(t)}</span>`).join('');
    const cover = item.coverUrl ? `<img src=\"${item.coverUrl}\" alt=\"cover\" class=\"w-full h-48 object-cover rounded mb-3\"/>` : '';
    const contentHtml = item.content || '';
    return `
      <div class=\"border border-gray-200 rounded-lg p-4\">
        <div class=\"flex justify-between items-start\">
          <div>
            <h3 class=\"text-lg font-semibold\">${escapeHtml(item.title)}</h3>
            <p class=\"text-xs text-gray-500\">${escapeHtml(item.slug || '')} · ${escapeHtml(item.status || '')}</p>
          </div>
          <div class=\"space-x-2\">
            <button id=\"edit-${item._id}\" class=\"text-[#8C1D40] hover:underline\">Edit</button>
            <button id=\"pub-${item._id}\" class=\"text-green-700 hover:underline\">Publish</button>
            <button id=\"del-${item._id}\" class=\"text-red-600 hover:underline\">Delete</button>
          </div>
        </div>
        ${cover}
        <div class=\"mt-3\">${contentHtml}</div>
        <div class=\"mt-3\">${tags}</div>
      </div>
    `;
  }

  function clearForm() {
    setValue('titleInput', '');
    setValue('slugInput', '');
    setValue('contentInput', '');
    setValue('tagsInput', '');
    const imageEl = document.getElementById('imageInput');
    if (imageEl) imageEl.value = '';
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  function setText(el, msg, cls) {
    if (!el) return;
    el.textContent = msg;
    el.className = `mt-3 text-sm ${cls || ''}`;
  }

  function slugify(text = '') {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
