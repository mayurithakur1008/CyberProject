const usersKey = "cyberapi_users";
const sessionKey = "cyberapi_session";

const loadUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(usersKey)) || [];
  } catch {
    return [];
  }
};

const saveUsers = (users) => {
  localStorage.setItem(usersKey, JSON.stringify(users));
};

const saveSession = (email) => {
  localStorage.setItem(sessionKey, email);
};

const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");

if (signupForm) {
  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    const users = loadUsers();
    if (users.some((u) => u.email === email)) {
      alert("Account already exists. Please log in.");
      return;
    }

    users.push({ name, email, password });
    saveUsers(users);
    saveSession(email);
    window.location.href = "index.html";
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    const users = loadUsers();
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) {
      alert("Invalid credentials.");
      return;
    }

    saveSession(email);
    window.location.href = "index.html";
  });
}
