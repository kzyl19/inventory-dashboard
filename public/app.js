const $ = (id) => document.getElementById(id);
const money = (n) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(url, options) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function loadStats() {
  const s = await api('/api/stats');
  $('statItems').textContent = s.totalItems;
  $('statQty').textContent = s.totalQuantity;
  $('statValue').textContent = money(s.totalValue);
  $('statLow').textContent = s.lowStock;
}

async function loadItems() {
  const items = await api('/api/items?q=' + encodeURIComponent($('search').value));
  $('tbody').innerHTML = items.length
    ? items.map((i) => `
      <tr>
        <td>${i.id}</td>
        <td>${esc(i.name)}</td>
        <td>${esc(i.category)}</td>
        <td class="${i.quantity <= 5 ? 'low' : ''}">${i.quantity}</td>
        <td>${money(i.price)}</td>
        <td class="actions">
          <button onclick="editItem(${i.id})">Edit</button>
          <button class="danger" onclick="deleteItem(${i.id})">Delete</button>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="6" class="empty">No items found.</td></tr>';
}

function refresh() { return Promise.all([loadItems(), loadStats()]); }

function resetForm() {
  $('itemForm').reset();
  $('itemId').value = '';
  $('formTitle').textContent = 'Add Item';
  $('saveBtn').textContent = 'Add';
  $('cancelBtn').hidden = true;
  $('message').textContent = '';
}

$('itemForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('itemId').value;
  const body = JSON.stringify({
    name: $('name').value,
    category: $('category').value,
    quantity: $('quantity').value,
    price: $('price').value,
  });
  try {
    await api(id ? `/api/items/${id}` : '/api/items', { method: id ? 'PUT' : 'POST', body });
    resetForm();
    refresh();
  } catch (err) {
    $('message').textContent = err.message;
  }
});

window.editItem = async (id) => {
  const i = await api('/api/items/' + id);
  $('itemId').value = i.id;
  $('name').value = i.name;
  $('category').value = i.category;
  $('quantity').value = i.quantity;
  $('price').value = i.price;
  $('formTitle').textContent = 'Edit Item #' + i.id;
  $('saveBtn').textContent = 'Update';
  $('cancelBtn').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteItem = async (id) => {
  if (!confirm('Delete this item?')) return;
  await api('/api/items/' + id, { method: 'DELETE' });
  refresh();
};

$('cancelBtn').addEventListener('click', resetForm);
let t;
$('search').addEventListener('input', () => { clearTimeout(t); t = setTimeout(loadItems, 250); });

refresh();
