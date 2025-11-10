// === Padaria do Chico — Carrinho (LocalStorage) ===
(function () {
  const STORAGE_KEY = 'pdc_cart_v1';

  const money = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const Cart = {
    items: [],
    load() {
      try { this.items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
      catch { this.items = []; }
      updateBadge();
    },
    save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items)); },
    add(item) {
      const found = this.items.find(i => i.id === item.id);
      if (found) { found.qty += item.qty || 1; }
      else { this.items.push({ ...item, qty: item.qty || 1 }); }
      this.save(); renderList(); updateBadge();
    },
    setQty(id, qty) {
      const it = this.items.find(i => i.id === id);
      if (!it) return;
      it.qty = Math.max(1, qty);
      this.save(); renderList(); updateBadge();
    },
    remove(id) {
      this.items = this.items.filter(i => i.id !== id);
      this.save(); renderList(); updateBadge();
    },
    clear() { this.items = []; this.save(); renderList(); updateBadge(); },
    total() { return this.items.reduce((acc, i) => acc + i.price * i.qty, 0); }
  };

  // DOM references
  let fab, badge, drawer, backdrop, itemsEl, totalEl, checkoutBtn, closeBtn;

  function createUI() {
    // FAB
    fab = document.createElement('button');
    fab.className = 'pdc-cart-fab';
    fab.setAttribute('aria-label', 'Abrir carrinho');

    // SVG carrinho (branco)
    fab.innerHTML = `
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M7 4h-2l-1 2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 6h14l-1.5 9h-11z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="9" cy="20" r="1.5" fill="white"/><circle cx="16" cy="20" r="1.5" fill="white"/>
      </svg>
    `;
    badge = document.createElement('span');
    badge.className = 'pdc-badge';
    badge.textContent = '0';
    fab.appendChild(badge);

    // Posicionar no canto inferior esquerdo
    document.body.appendChild(fab);

    // Backdrop
    backdrop = document.createElement('div');
    backdrop.className = 'pdc-backdrop';
    document.body.appendChild(backdrop);

    // Drawer
    drawer = document.createElement('aside');
    drawer.className = 'pdc-cart-drawer';
    drawer.innerHTML = `
      <div class="pdc-cart-header">
        <div class="pdc-cart-title">Seu Carrinho</div>
        <button class="pdc-cart-close" aria-label="Fechar">✕</button>
      </div>
      <div class="pdc-cart-items"></div>
      <div class="pdc-cart-footer">
        <div class="pdc-total-line">
          <span>Total</span>
          <b class="pdc-total">R$ 0,00</b>
        </div>
        <button class="pdc-btn-primary pdc-go-checkout">Finalizar Pedido</button>
        <button class="pdc-btn-secondary pdc-continue" style="display:none;">Continuar Comprando</button>
      </div>
    `;
    document.body.appendChild(drawer);

    itemsEl = drawer.querySelector('.pdc-cart-items');
    totalEl = drawer.querySelector('.pdc-total');
    checkoutBtn = drawer.querySelector('.pdc-go-checkout');
    closeBtn = drawer.querySelector('.pdc-cart-close');

    // Events
    fab.addEventListener('click', openDrawer);
    closeBtn.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);
    checkoutBtn.addEventListener('click', () => {
      if (!Cart.items.length) {
        alert("Adicione algum item ao carrinho antes de finalizar o pedido :)");
        return;
      }
      window.location.href = 'checkout.html';
    });

  }

  function openDrawer() {
    drawer.classList.add('pdc-open');
    backdrop.classList.add('pdc-open');
  }
  function closeDrawer() {
    drawer.classList.remove('pdc-open');
    backdrop.classList.remove('pdc-open');
  }

  function renderList() {
    if (!itemsEl) return;
    itemsEl.innerHTML = '';

    const continueBtn = drawer.querySelector('.pdc-continue');
    const checkoutBtn = drawer.querySelector('.pdc-go-checkout');

    if (!Cart.items.length) {
      itemsEl.innerHTML = '<p style="opacity:.6; padding: 10px;">Seu carrinho está vazio.</p>';

      // Carrinho vazio → esconder checkout, mostrar continuar comprando
      checkoutBtn.style.display = 'none';
      continueBtn.style.display = 'block';

      continueBtn.onclick = () => {
        closeDrawer();
      };

    } else {
      // Carrinho com itens → mostrar checkout, esconder continuar comprando
      checkoutBtn.style.display = 'block';
      continueBtn.style.display = 'none';

      Cart.items.forEach(it => {
        const row = document.createElement('div');
        row.className = 'pdc-item';
        row.innerHTML = `
        <div class="pdc-item-title">${it.name}</div>
        <div class="pdc-item-price">${money(it.price)}</div>
        <div class="pdc-qty">
          <button aria-label="Diminuir">-</button>
          <input type="number" min="1" value="${it.qty}" />
          <button aria-label="Aumentar">+</button>
        </div>
        <button class="pdc-remove" style="justify-self:end;background:#fee2e2;border:0;padding:8px 10px;border-radius:10px;cursor:pointer;font-weight:700;color:#991b1b">Remover</button>
      `;

        const [btnMinus, input, btnPlus] = row.querySelectorAll('.pdc-qty *');
        const btnRemove = row.querySelector('.pdc-remove');

        btnMinus.addEventListener('click', () => {
          Cart.setQty(it.id, Math.max(1, it.qty - 1));
        });
        btnPlus.addEventListener('click', () => {
          Cart.setQty(it.id, it.qty + 1);
        });
        input.addEventListener('change', () => {
          const val = parseInt(input.value, 10) || 1;
          Cart.setQty(it.id, Math.max(1, val));
        });
        btnRemove.addEventListener('click', () => Cart.remove(it.id));

        itemsEl.appendChild(row);
      });
    }

    totalEl.textContent = money(Cart.total());
  }


  function updateBadge() {
    if (!badge) return;
    const count = Cart.items.reduce((acc, i) => acc + i.qty, 0);
    badge.textContent = String(count);
  }

  function bindAddToCartButtons() {
    // Qualquer botão com classe .add-to-cart e data-id, data-name, data-price
    document.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name') || 'Produto';
        const price = parseFloat(btn.getAttribute('data-price') || '0');
        Cart.add({ id, name, price, qty: 1 });
        // Feedback rápido
        fab.classList.add('pdc-pulse');
        setTimeout(() => fab.classList.remove('pdc-pulse'), 200);
      });
    });
  }

  // init
  document.addEventListener('DOMContentLoaded', () => {
    createUI();
    Cart.load();
    renderList();
    bindAddToCartButtons();
  });

  // Expor utilitários globalmente (opcional)
  window.PDCCart = Cart;
})();
