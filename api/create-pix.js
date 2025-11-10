export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const SECRET = process.env.BEEHIVE_SECRET;

    if (!SECRET) {
      return res.status(500).json({ error: "BEEHIVE_SECRET não configurado" });
    }

    const auth = Buffer.from(`${SECRET}:`).toString("base64");

    const { orderId, amount, items, customer } = req.body;

    const payload = {
      amount,
      paymentMethod: "pix",
      customer: {
        name: customer.nome,
        documents: [{ type: "cpf", number: customer.cpf }],
        phoneNumber: customer.whats
      },
      items: items.map(item => ({
        title: item.name,
        unitPrice: Math.round(item.price * 100),
        quantity: item.qty
      })),
      pix: { expiresInDays: 1 },
      metadata: { orderId },
      postbackUrl: `https://${req.headers.host}/api/webhook`
    };

    const response = await fetch("https://api.conta.paybeehive.com.br/v1/transactions", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("RESPOSTA BEEHIVE:", data);

    if (!data.qrCode) {
      return res.status(400).json({ error: "Erro ao gerar PIX", details: data });
    }

    return res.json({
      pix: {
        qrcode: data.qrCode,
        code: data.qrCode,
        qrcodeImage: data.qrCodeImage
      }
    });

  } catch (err) {
    console.error("PIX ERROR =>", err);
    return res.status(500).json({ error: "Falha interna ao gerar PIX" });
  }
}
