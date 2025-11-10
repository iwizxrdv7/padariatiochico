export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const CLIENT_ID = process.env.BEEHIVE_CLIENT_ID;
  const CLIENT_SECRET = process.env.BEEHIVE_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: "Chaves não configuradas no servidor" });
  }

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const { amount, customer, items } = req.body;

  const payload = {
    amount,
    paymentMethod: "pix",
    customer: {
      name: customer.nome,
      document: { type: "cpf", number: customer.cpf },
      phone: customer.whats
    },
    items: items.map(item => ({
      title: item.name,
      unitPrice: Math.round(item.price * 100),
      quantity: item.qty
    })),
    pix: { expiresInDays: 1 },
    metadata: { checkout_origin: "Padaria do Chico" }
  };

  const response = await fetch("https://api.conta.paybeehive.com.br/v1/transactions", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(400).json({ error: "Erro ao gerar PIX", details: data });
  }

  return res.json({
    pix: {
      qrcode: data.qrCode,
      code: data.qrCode,
      qrcodeImage: data.qrCodeImage
    }
  });
}
