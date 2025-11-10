// === Padaria do Chico — Checkout ===
// Carrega itens do carrinho, aplica máscaras e valida CEP via ViaCEP com restrição a Viamão - RS.

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(updateDelivery, 200);
    const STORAGE_KEY = "pdc_cart_v1";

    // --------- Utils
    const money = v => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const el = id => document.getElementById(id);

    // Converte "R$ 12.345,67" -> 12345.67
    const parseBRL = (txt = "") => {
        const n = String(txt).replace(/[^\d,]/g, "").replace(".", "").replace(",", ".");
        const f = parseFloat(n);
        return isNaN(f) ? 0 : f;
    };

    // Atualiza o texto do botão com total final (itens + frete)
    function updateConfirmLabel() {
        const confirmBtn = document.getElementById("confirm-btn");
        if (!confirmBtn) return;

        const total = parseBRL(document.getElementById("total-value")?.textContent || "0");
        const deliveryTxt = document.getElementById("delivery-value")?.textContent || "0";
        const delivery = /grátis/i.test(deliveryTxt) ? 0 : parseBRL(deliveryTxt);

        const final = total + delivery;
        confirmBtn.textContent = `Confirmar Pedido no valor de ${final.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
    }


    // Botão confirmar
    const confirmBtn = el("confirm-btn");

    // --------- Render do carrinho
    const cartItemsEl = el("cart-items");
    const totalValueEl = el("total-value");

    let cart = [];
    try { cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { cart = []; }

    function renderCart() {
        if (!cart.length) {
            cartItemsEl.innerHTML = `<p style="opacity:.6; padding:10px;">Seu carrinho está vazio.</p>`;
            totalValueEl.textContent = money(0);
            confirmBtn.disabled = true;
            return;
        }
        cartItemsEl.innerHTML = "";
        let total = 0;
        cart.forEach(item => {
            const line = document.createElement("div");
            line.className = "checkout-item";
            line.style.cssText = "display:flex;justify-content:space-between;margin-bottom:8px;";
            const subtotal = (item.price || 0) * (item.qty || 1);
            total += subtotal;
            line.innerHTML = `<span>${item.qty}x ${item.name}</span><span>${money(subtotal)}</span>`;
            cartItemsEl.appendChild(line);
        });
        totalValueEl.textContent = money(total);

        updateDelivery();
        updateConfirmLabel();
        updateTotalsUI(); // <-- ADICIONE ISSO AQUI

        // Atualiza o rótulo do botão com o total
        if (confirmBtn) {
            confirmBtn.textContent = `Confirmar Pedido no valor de ${money(total)}`;
        }


        // não 
        // habilita ainda — CEP pode bloquear
    }
    renderCart();



    // --------- Máscaras
    const cpfInput = el("cpf");
    const whatsappInput = el("whatsapp"); // << id correto no HTML
    const cepInput = el("cep");

    const maskCPF = v => v.replace(/\D/g, "")
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    const maskPhone = v => v.replace(/\D/g, "")
        .slice(0, 11)
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d{4})$/, "$1-$2");

    const maskCEP = v => v.replace(/\D/g, "")
        .slice(0, 8)
        .replace(/(\d{5})(\d{3})/, "$1-$2");

    cpfInput.addEventListener("input", e => e.target.value = maskCPF(e.target.value));
    whatsappInput.addEventListener("input", e => e.target.value = maskPhone(e.target.value));
    cepInput.addEventListener("input", e => e.target.value = maskCEP(e.target.value));

    // --------- ViaCEP + Bloqueio Viamão
    const ruaInput = el("rua");
    const bairroInput = el("bairro");
    const cidadeInput = el("cidade");
    const cepError = el("cep-error");

    function setCEPErr(msg) {
        cepError.textContent = msg || "";
        cepError.classList.toggle("show", !!msg);
        // Com erro de cobertura, desabilita confirmação
        if (msg) confirmBtn.disabled = true;
    }

    async function validateCEP() {
        const raw = cepInput.value.replace(/\D/g, "");
        if (raw.length !== 8) { setCEPErr(""); return; }

        try {
            const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
            const data = await res.json();
            if (data.erro) { setCEPErr("CEP não encontrado. Verifique."); return; }

            // Preenche endereço
            ruaInput.value = data.logradouro || "";
            bairroInput.value = data.bairro || "";

            // Normaliza cidade/UF e restringe a Viamão - RS
            const cidade = (data.localidade || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const uf = (data.uf || "").toUpperCase();

            const isViamao = cidade === "viamao" && uf === "RS";

            if (!isViamao) {
                cidadeInput.value = `${data.localidade || ""} - ${uf}`;
                setCEPErr("A Padaria do Chico entrega apenas em Viamão - RS. Verifique seu CEP.");
            } else {
                cidadeInput.value = "Viamão - RS";
                setCEPErr("");
                // Habilita confirmar somente se tiver itens no carrinho
                confirmBtn.disabled = !cart.length;
            }
        } catch {
            setCEPErr("Erro ao buscar CEP. Tente novamente.");
        }
    }

    cepInput.addEventListener("blur", validateCEP);

    // --------- (opcional) Validação básica ao confirmar
    confirmBtn.addEventListener("click", async () => {
        if (confirmBtn.disabled) return;

        const nome = el("nome").value.trim();
        const cpf = cpfInput.value.replace(/\D/g, "");
        const phone = whatsappInput.value.replace(/\D/g, "");
        const cep = cepInput.value.replace(/\D/g, "");
        const rua = ruaInput.value.trim();
        const numero = el("numero").value.trim();
        const bairro = bairroInput.value.trim();

        if (!nome || cpf.length !== 11 || phone.length < 10 || cep.length !== 8 || !rua || !numero || !bairro) {
            alert("Preencha os dados corretamente.");
            return;
        }

        const items = getCartItems();
        const subtotal = calcSubtotal(items);
        const delivery = subtotal >= DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
        const totalFinal = subtotal + delivery;
    });

});

// === TIMER DE RESERVA DO CARRINHO ===
let time = 15 * 60; // 15 minutos

function updateTimer() {
    const display = document.getElementById("timer");
    if (!display) return;

    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    display.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

    if (time <= 0) {
        document.querySelector('.checkout-timer-bar').style.background = "#b30000";
        display.innerHTML = "Expirado";

        alert("Seu tempo acabou! Atualize a página para garantir a disponibilidade dos produtos.");
        return;
    }

    time--;
    setTimeout(updateTimer, 1000);
}

updateTimer();

function getPaymentMethod() {
    return document.querySelector('input[name="payment"]:checked').value;
}

function updateDelivery() {
    const deliverySpan = document.getElementById("delivery-value");
    const totalText = document.getElementById("total-value").innerText.replace("R$", "").trim();
    const total = parseFloat(totalText.replace(".", "").replace(",", "."));

    if (isNaN(total)) {
        deliverySpan.innerText = "Calculando...";
        return;
    }

    if (total < 19.99) {
        deliverySpan.innerText = "R$ 4,88";
        deliverySpan.classList.remove("delivery-free");
    } else {
        deliverySpan.innerText = "Grátis";
        deliverySpan.classList.add("delivery-free");
        showFreeShippingMessage();



    }
}


function showFreeShippingMessage() {
    const msg = document.createElement("div");
    msg.className = "free-shipping-alert";
    msg.innerHTML = "Você ganhou <b>ENTREGA GRÁTIS!</b> 🚀";

    document.body.appendChild(msg);

    setTimeout(() => {
        msg.classList.add("show");
    }, 10);

    setTimeout(() => {
        msg.classList.remove("show");
        setTimeout(() => msg.remove(), 300);
    }, 3000);
}

// === Totais do checkout ===
const STORAGE_KEY = 'pdc_cart_v1'; // mesma chave do carrinho
const DELIVERY_THRESHOLD = 19.99;
const DELIVERY_FEE = 4.88;

const money = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function getCartItems() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
}

function calcSubtotal(items) {
    return items.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
}

function updateTotalsUI() {
    const items = getCartItems();
    const subtotal = calcSubtotal(items);

    // Total (itens)
    const totalEl = document.getElementById('total-value');
    if (totalEl) totalEl.textContent = money(subtotal);

    // Entrega (regra)
    const deliveryEl = document.getElementById('delivery-value');
    let delivery = 0;
    if (subtotal >= DELIVERY_THRESHOLD) {
        delivery = 0;
        if (deliveryEl) {
            deliveryEl.textContent = 'Grátis';
            deliveryEl.classList.add('text-green');
        }
    } else if (subtotal > 0) {
        delivery = DELIVERY_FEE;
        if (deliveryEl) {
            deliveryEl.textContent = money(delivery);
            deliveryEl.classList.remove('text-green');
        }
    }

    // Botão com valor final (subtotal + frete)
    const final = subtotal + delivery;
    const btn = document.getElementById('confirm-btn');
    if (btn) btn.textContent = `Confirmar Pedido no valor de ${money(final)}`;
}

function mostrarPixModal(qrCode, qrImage) {
  const modal = document.getElementById("pix-modal");
  const pixCodeInput = document.getElementById("pix-code");
  const pixImage = document.getElementById("pix-image");

  pixCodeInput.value = qrCode;
  pixImage.src = qrImage;

  modal.classList.remove("hidden");

  document.getElementById("copy-btn").onclick = () => {
    navigator.clipboard.writeText(qrCode);
    alert("Código PIX copiado!");
  };

  document.getElementById("close-pix").onclick = () => {
    modal.classList.add("hidden");
  };
}

confirmBtn.addEventListener("click", async () => {

  const items = getCartItems();
  const total = calcSubtotal(items);

  const customer = {
    nome: document.getElementById("nome").value.trim(),
    cpf: document.getElementById("cpf").value.replace(/\D/g, ""),
    whats: document.getElementById("whatsapp").value.replace(/\D/g, "")
  };

  const resp = await fetch("/api/create-pix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: Math.round(total * 100),
      items,
      customer
    })
  });

  const data = await resp.json();
  mostrarPixModal(data.pix.code, data.pix.qrcodeImage);
});


document.addEventListener('DOMContentLoaded', updateTotalsUI);










