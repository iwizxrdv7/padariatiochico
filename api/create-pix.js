export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { BEEHIVE_CLIENT_ID, BEEHIVE_SECRET } = process.env;

    if (!BEEHIVE_CLIENT_ID || !BEEHIVE_SECRET) {
      return res.status(500).json({ error: "Credenciais não configuradas no Vercel" });
    }

    // Autenticação Base64 → secret:x
    const token = Buffer.from(`${BEEHIVE_SECRET}:x`).toString("base64");

    const { amount, customer } = req.body;

    const payload = {
      amount, // exemplo: 2000 = R$ 20,00
      paymentMethod: "pix",
      customer: {
        name: customer.name,
        document: { type: "cpf", number: customer.cpf },
        phone: customer.whatsapp
      },
      pix: { expiresInDays: 1 },
      description: "Pedido Padaria do Chico"
    };

    const response = await fetch("https://api.conta.paybeehive.com.br/v1/transactions", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("RETORNO DA API:", data);

    if (!data.pix) {
      return res.status(400).json({ error: "Erro ao gerar PIX", details: data });
    }

    return res.status(200).json({
      qrcode: data.pix.qrcode,
      url: data.pix.url
    });

  } catch (error) {
    console.log("PIX ERROR", error);
    return res.status(500).json({ error: "Erro interno ao gerar PIX" });
  }
}
