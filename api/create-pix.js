export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });

  try {
    const SECRET = process.env.BEEHIVE_SECRET;
    const token = Buffer.from(`${SECRET}:x`).toString("base64");

    const { orderId, amount, items, customer } = req.body;

    const payload = {
      amount, // em centavos ex: R$25,00 => 2500
      paymentMethod: "pix",
      items: items.map(item => ({
        title: item.name,
        quantity: item.qty,
        unitPrice: Math.round(item.price * 100) // centavos
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
        Authorization: `Basic ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "create-pix-failed" });
  }
}
