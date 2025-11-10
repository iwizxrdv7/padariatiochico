export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const CLIENT_ID = process.env.BEEHIVE_CLIENT_ID;
    const CLIENT_SECRET = process.env.BEEHIVE_SECRET;
    Authorization: `Basic ${Buffer.from(`${SECRET}:`).toString("base64")}`
    const { orderId, amount, items, customer } = req.body;

    const payload = {
      amount: Math.round(amount * 100),
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
      metadata: orderId,
      postbackUrl: `https://${req.headers.host}/api/webhook`
    };

    const response = await fetch("https://api.conta.paybeehive.com.br/v1/transactions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!data.pix || !data.pix.qrCode) {
      return res.status(400).json({ error: "Erro ao gerar PIX", details: data });
    }

    return res.status(200).json({
      qrcode: data.pix.qrCode,
      qrcodeImage: data.pix.qrCodeImage,
      expiresAt: data.pix.expiresAt
    });

  } catch (e) {
    console.log("PIX ERROR =>", e);
    return res.status(500).json({ error: "Falha interna ao gerar PIX" });
  }
}
