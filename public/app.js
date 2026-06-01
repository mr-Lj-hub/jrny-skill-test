const API = '/api';
let token = localStorage.getItem('token');

function showMessage(msg) {
  document.getElementById('message').innerText = msg;
}

function showTasks() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('tasks-section').style.display = 'block';
  loadTasks();
}

async function register() {
  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  const res = await fetch(API + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    localStorage.setItem('token', token);
    showTasks();
  } else {
    showMessage(data.error || 'Registration failed');
  }
}

async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const res = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    localStorage.setItem('token', token);
    showTasks();
  } else {
    showMessage(data.error || 'Login failed');
  }
}

async function loadTasks() {
  const res = await fetch(API + '/tasks', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const tasks = await res.json();
  const list = document.getElementById('task-list');
  list.innerHTML = '';
  tasks.forEach((t) => {
    const li = document.createElement('li');
    li.innerHTML = '<span>' + t.title + ' — ' + t.status + '</span>';
    list.appendChild(li);
  });
}

async function createTask() {
  const title = document.getElementById('task-title').value;
  const description = document.getElementById('task-description').value;

  await fetch(API + '/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ title, description })
  });
  document.getElementById('task-title').value = '';
  document.getElementById('task-description').value = '';
  loadTasks();
}

function logout() {
  token = null;
  localStorage.removeItem('token');
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('tasks-section').style.display = 'none';
}

if (token) {
  showTasks();
}
