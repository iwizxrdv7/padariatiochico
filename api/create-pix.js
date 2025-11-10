export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const SECRET = process.env.BEEHIVE_SECRET;
    const { orderId, amount, items, customer } = req.body;

    const payload = {
      amount: Math.round(amount * 100),
      paymentMethod: "pix",
      items: items.map(item => ({
        title: item.name,
        quantity: item.qty,
        unitPrice: Math.round(item.price * 100)
      })),
      customer: {
        name: customer.nome,
        documents: customer.cpf ? [{ type: "cpf", number: customer.cpf }] : undefined,
        phoneNumber: customer.whats
      },
      postbackUrl: `https://${req.headers.host}/api/webhook`,
      metadata: { orderId }
    };

    const response = await fetch("https://api.conta.paybeehive.com.br/v1/transactions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SECRET}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("PAYBEEHIVE RESPONSE =>", data);

    if (!data.qrCode || !data.qrCodeImage) {
      return res.status(400).json({ error: "Erro ao gerar PIX", details: data });
    }

    return res.status(200).json({
      qrcode: data.qrCode,
      qrcodeImage: data.qrCodeImage,
      expiresAt: data.expiresAt
    });

  } catch (error) {
    console.error("PIX ERROR =>", error);
    return res.status(500).json({ error: "Erro interno ao gerar PIX" });
  }
}
