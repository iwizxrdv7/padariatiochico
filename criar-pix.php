fetch("https://padariadotiochico.vercel.app/criar-pix.php", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    orderId: Date.now(),
    amount: Math.round(totalFinal * 100),
    items: items,
    customer: { nome, cpf, whats: phone }
  })
})
.then(r => r.json())
.then(data => {
  const code = data.pix.qrCode;
  const img = data.pix.qrCodeImage;
  mostrarPixModal(code, img);
});
