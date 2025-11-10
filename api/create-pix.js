export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const PUBLIC = process.env.BEEHIVE_PUBLIC;
    const SECRET = process.env.BEEHIVE_SECRET;

    // AQUI ESTAVA O ERRO
    const auth = Buffer.from(`${PUBLIC}:${SECRET}`).toString("base64");

    const { orderId, amount, items, customer } = req.body;

    const payload = {
      amount,
      paymentMethod: "pix",
      customer: {
        name: customer.nome,
        document: { type: "cpf", number: customer.cpf },
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

    // Se der erro, joga na cara pra debug
    if (!data.qrCode) {
      return res.status(400).json({ error: "Erro ao gerar PIX", details: data });
    }

    return res.status(200).json({
      pix: {
        qrcode: data.qrCode,
        code: data.qrCode,
        qrcodeImage: data.qrCodeImage
      }
    });

  } catch (error) {
    console.error("PIX ERROR =>", error);
    return res.status(500).json({ error: "Falha interna ao gerar PIX" });
  }
}
