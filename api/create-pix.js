export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { amount, orderId } = req.body;

  try {
    const response = await fetch("https://app.beehivepay.com/api/v2/charge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer sk_live_v2vrnO9Ru3iRM273bUGBS6nMHd4fBgiB1OMnwFObm9`
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // converte para centavos
        currency: "BRL",
        description: `Pedido #${orderId}`,
      }),
    });

    const data = await response.json();

    if (!data.qrcode) {
      return res.status(400).json({
        error: "Erro ao gerar PIX",
        response: data
      });
    }

    return res.status(200).json({
      qrcode: data.qrcode,
      code: data.code,
      expiresIn: data.expiresAt
    });

  } catch (error) {
    console.error("Erro ao gerar PIX:", error);
    return res.status(500).json({ error: "Erro interno ao gerar PIX" });
  }
}
