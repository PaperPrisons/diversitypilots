// scripts/blog-admin.js (ESM)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgZXZlsj6phh-P8h2HMXYRX3yNH9-FQ90",
  authDomain: "diversitypilots-6eaa2.firebaseapp.com",
  projectId: "diversitypilots-6eaa2",
  storageBucket: "diversitypilots-6eaa2.firebasestorage.app",
  messagingSenderId: "755498707275",
  appId: "1:755498707275:web:b89b60443069dc428b60ce",
  measurementId: "G-KS4MYHE4ZD",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

const $ = (id) => document.getElementById(id);

const els = {
  authStatus: $("auth-status"),
  loginForm: $("login-form"),
  btnLogout: $("btn-logout"),
  editorSection: $("editor-section"),
  listSection: $("list-section"),
  postForm: $("post-form"),
  postsTbody: $("posts-tbody"),
  btnRefresh: $("btn-refresh"),
  btnClear: $("btn-clear"),
  btnDelete: $("btn-delete"),
  btnUpload: $("btn-upload"),
  formMsg: $("form-msg"),

  docId: $("doc-id"),
  title: $("title"),
  summary: $("summary"),
  image: $("image"),
  imageFile: $("imageFile"),
  facebook: $("facebook"),
  linkedin: $("linkedin"),
  otherLink: $("otherLink"),
  email: $("email"),
  password: $("password"),
};

function setMsg(text, kind = "info") {
  if (!els.formMsg) return;
  els.formMsg.textContent = text || "";
  els.formMsg.className =
    kind === "error"
      ? "text-sm mt-3 text-red-700"
      : kind === "success"
        ? "text-sm mt-3 text-green-700"
        : "text-sm mt-3 text-gray-700";
}

function clearEditor() {
  els.docId.value = "";
  els.title.value = "";
  els.summary.value = "";
  els.image.value = "";
  els.facebook.value = "";
  els.linkedin.value = "";
  els.otherLink.value = "";
  if (els.imageFile) els.imageFile.value = "";
  els.btnDelete.classList.add("hidden");
  setMsg("");
}

function toDateString(createdAt) {
  // createdAt can be Firestore Timestamp, Date, or missing
  try {
    if (!createdAt) return "";
    if (typeof createdAt.toDate === "function") return createdAt.toDate().toLocaleString();
    if (createdAt instanceof Date) return createdAt.toLocaleString();
    return String(createdAt);
  } catch {
    return "";
  }
}

function renderRows(docs) {
  if (!els.postsTbody) return;
  if (!docs.length) {
    els.postsTbody.innerHTML = `<tr><td class="py-3 text-gray-500" colspan="2">No posts.</td></tr>`;
    return;
  }

  els.postsTbody.innerHTML = "";
  docs.forEach(({ id, data }) => {
    const tr = document.createElement("tr");
    tr.className = "border-b hover:bg-gray-50 cursor-pointer";
    tr.innerHTML = `
      <td class="py-3 pr-4 font-semibold text-gray-900">${data.title || "Untitled"}</td>
      <td class="py-3 pr-4 text-gray-600">${toDateString(data.createdAt)}</td>
    `;
    tr.addEventListener("click", () => {
      els.docId.value = id;
      els.title.value = data.title || "";
      els.summary.value = data.summary || "";
      els.image.value = data.image || "";
      els.facebook.value = (data.social && data.social.facebook) || "";
      els.linkedin.value = (data.social && data.social.linkedin) || "";
      els.otherLink.value = (data.social && data.social.other) || "";
      els.btnDelete.classList.remove("hidden");
      setMsg(`Editing "${data.title || "Untitled"}"`, "info");
      window.scrollTo({ top: els.editorSection.offsetTop - 20, behavior: "smooth" });
    });
    els.postsTbody.appendChild(tr);
  });
}

async function loadPosts() {
  if (!els.postsTbody) return;
  els.postsTbody.innerHTML = `<tr><td class="py-3 text-gray-500" colspan="2">Loading…</td></tr>`;

  const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map((d) => ({ id: d.id, data: d.data() || {} }));
  renderRows(docs);
}

async function savePost() {
  const title = els.title.value.trim();
  const summary = els.summary.value.trim();
  const image = els.image.value.trim();
  const facebook = els.facebook.value.trim();
  const linkedin = els.linkedin.value.trim();
  const other = els.otherLink.value.trim();

  if (!title) {
    setMsg("Title is required.", "error");
    return;
  }

  const payload = {
    title,
    summary,
    image,
    social: {
      facebook,
      linkedin,
      other,
    },
  };

  const id = els.docId.value.trim();
  if (id) {
    await updateDoc(doc(db, "blogs", id), payload);
    setMsg("Post updated.", "success");
  } else {
    await addDoc(collection(db, "blogs"), { ...payload, createdAt: serverTimestamp() });
    setMsg("Post created.", "success");
  }

  clearEditor();
  await loadPosts();
}

async function deletePost() {
  const id = els.docId.value.trim();
  if (!id) return;
  const ok = confirm("Delete this post? This cannot be undone.");
  if (!ok) return;

  await deleteDoc(doc(db, "blogs", id));
  setMsg("Post deleted.", "success");
  clearEditor();
  await loadPosts();
}

async function login(email, password) {
  await signInWithEmailAndPassword(auth, email, password);
}

function setAuthedUI(user) {
  const isAuthed = !!user;
  els.loginForm.classList.toggle("hidden", isAuthed);
  els.btnLogout.classList.toggle("hidden", !isAuthed);
  els.editorSection.classList.toggle("hidden", !isAuthed);
  els.listSection.classList.toggle("hidden", !isAuthed);
  els.authStatus.textContent = isAuthed ? `Signed in as ${user.email || "user"}` : "Signed out";
}

function sanitizeFilename(name) {
  return String(name || "upload")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 80);
}

async function uploadImageFile(file) {
  if (!file) throw new Error("No file selected");
  const ext = (file.name && file.name.includes(".")) ? file.name.split(".").pop() : "png";
  const base = sanitizeFilename(file.name);
  const path = `blog-images/${Date.now()}-${base || "image"}.${sanitizeFilename(ext)}`;
  const r = storageRef(storage, path);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}

// Events
els.loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg("");
  try {
    const email = els.email.value.trim();
    const password = els.password.value;
    await login(email, password);
  } catch (err) {
    console.error("[Admin] login failed:", err);
    setMsg("Login failed. Check credentials and Firebase Auth settings.", "error");
  }
});

els.btnLogout?.addEventListener("click", async () => {
  await signOut(auth);
});

els.postForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg("");
  try {
    await savePost();
  } catch (err) {
    console.error("[Admin] save failed:", err);
    setMsg("Save failed. Check Firestore rules for write access.", "error");
  }
});

els.btnDelete?.addEventListener("click", async () => {
  setMsg("");
  try {
    await deletePost();
  } catch (err) {
    console.error("[Admin] delete failed:", err);
    setMsg("Delete failed. Check Firestore rules for delete access.", "error");
  }
});

els.btnRefresh?.addEventListener("click", async () => {
  setMsg("");
  try {
    await loadPosts();
  } catch (err) {
    console.error("[Admin] refresh failed:", err);
    setMsg("Refresh failed. Check Firestore read access.", "error");
  }
});

els.btnClear?.addEventListener("click", () => clearEditor());

els.btnUpload?.addEventListener("click", async () => {
  setMsg("");
  try {
    const file = els.imageFile?.files?.[0];
    if (!file) {
      setMsg("Choose an image file first.", "error");
      return;
    }
    setMsg("Uploading image…", "info");
    const url = await uploadImageFile(file);
    els.image.value = url;
    setMsg("Image uploaded and URL filled in.", "success");
  } catch (err) {
    console.error("[Admin] upload failed:", err);
    setMsg("Upload failed. Check Firebase Storage rules/permissions.", "error");
  }
});

onAuthStateChanged(auth, async (user) => {
  setAuthedUI(user);
  clearEditor();
  if (user) {
    try {
      await loadPosts();
    } catch (err) {
      console.error("[Admin] initial load failed:", err);
      setMsg("Could not load posts. Check Firestore read access.", "error");
    }
  } else {
    if (els.postsTbody) {
      els.postsTbody.innerHTML = `<tr><td class="py-3 text-gray-500" colspan="4">Login to view posts.</td></tr>`;
    }
  }
});


