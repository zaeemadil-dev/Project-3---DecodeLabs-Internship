const form = document.getElementById('contactForm');
const rows = document.getElementById('contactRows');
const messageBox = document.getElementById('message');
const searchInput = document.getElementById('searchInput');
const saveButton = document.getElementById('saveButton');
const cancelEdit = document.getElementById('cancelEdit');
let contacts = [];
let editingId = null;

function showMessage(message, type = 'success') {
  messageBox.textContent = message;
  messageBox.className = `message ${type}`;
  window.clearTimeout(showMessage.timer);
  showMessage.timer = window.setTimeout(() => messageBox.classList.add('hidden'), 3500);
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || 'Something went wrong.');
  return result;
}

function updateSummary() {
  document.getElementById('totalContacts').textContent = contacts.length;
  document.getElementById('universityCount').textContent = contacts.filter(c => c.category === 'University').length;
  document.getElementById('personalCount').textContent = contacts.filter(c => c.category === 'Personal').length;
  document.getElementById('listCount').textContent = `(${contacts.length})`;
}

function makeCellText(value) {
  const cell = document.createElement('td');
  cell.textContent = value || '—';
  return cell;
}

function renderContacts() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = contacts.filter(contact =>
    `${contact.name} ${contact.email} ${contact.phone} ${contact.category}`.toLowerCase().includes(query)
  );
  rows.replaceChildren();
  document.getElementById('emptyState').classList.toggle('hidden', filtered.length !== 0);
  document.querySelector('.table-wrap').classList.toggle('hidden', filtered.length === 0);

  filtered.forEach(contact => {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    const nameWrap = document.createElement('div');
    nameWrap.className = 'contact-name';
    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.textContent = contact.name.trim().charAt(0).toUpperCase();
    const name = document.createElement('span');
    name.textContent = contact.name;
    nameWrap.append(avatar, name);
    nameCell.append(nameWrap);
    row.append(nameCell);

    const categoryCell = document.createElement('td');
    const category = document.createElement('span');
    category.className = 'category';
    category.textContent = contact.category;
    categoryCell.append(category);
    row.append(categoryCell, makeCellText(contact.phone));

    const actionCell = document.createElement('td');
    const actionWrap = document.createElement('div');
    actionWrap.className = 'actions';
    const edit = document.createElement('button');
    edit.className = 'action-btn';
    edit.textContent = 'Edit';
    edit.type = 'button';
    edit.addEventListener('click', () => startEdit(contact));
    const remove = document.createElement('button');
    remove.className = 'action-btn delete-btn';
    remove.textContent = 'Delete';
    remove.type = 'button';
    remove.addEventListener('click', () => deleteContact(contact.id));
    actionWrap.append(edit, remove);
    actionCell.append(actionWrap);
    row.append(actionCell);
    rows.append(row);
  });
  updateSummary();
}

async function loadContacts() {
  try {
    const result = await apiRequest('/api/contacts');
    contacts = result.data;
    renderContacts();
  } catch (error) {
    showMessage(`Could not load contacts: ${error.message}`, 'error');
    rows.innerHTML = '<tr><td colspan="4" class="loading">Could not load contacts. Check that the server is running, then refresh.</td></tr>';
  }
}

function resetForm() {
  form.reset();
  editingId = null;
  document.getElementById('formHeading').textContent = 'Add a contact';
  saveButton.innerHTML = 'Save contact <span>→</span>';
  cancelEdit.classList.add('hidden');
}

function startEdit(contact) {
  editingId = contact.id;
  document.getElementById('name').value = contact.name;
  document.getElementById('email').value = contact.email;
  document.getElementById('phone').value = contact.phone || '';
  document.getElementById('category').value = contact.category;
  document.getElementById('formHeading').textContent = 'Update contact';
  saveButton.innerHTML = 'Update contact <span>→</span>';
  cancelEdit.classList.remove('hidden');
  document.getElementById('name').focus();
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const contact = Object.fromEntries(new FormData(form).entries());
  saveButton.disabled = true;
  saveButton.textContent = editingId ? 'Updating...' : 'Saving...';
  try {
    const url = editingId ? `/api/contacts/${editingId}` : '/api/contacts';
    const method = editingId ? 'PUT' : 'POST';
    const result = await apiRequest(url, { method, body: JSON.stringify(contact) });
    showMessage(result.message, 'success');
    resetForm();
    await loadContacts();
  } catch (error) {
    showMessage(error.message, 'error');
  } finally {
    saveButton.disabled = false;
    if (editingId) saveButton.textContent = 'Update contact →';
    else saveButton.innerHTML = 'Save contact <span>→</span>';
  }
});

async function deleteContact(id) {
  if (!window.confirm('Delete this contact? This cannot be undone.')) return;
  try {
    const result = await apiRequest(`/api/contacts/${id}`, { method: 'DELETE' });
    if (editingId === id) resetForm();
    showMessage(result.message, 'success');
    await loadContacts();
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

cancelEdit.addEventListener('click', resetForm);
searchInput.addEventListener('input', renderContacts);
loadContacts();
