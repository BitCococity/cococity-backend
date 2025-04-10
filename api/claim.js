import { ethers } from "ethers";

const claimedToday = new Set();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Método no permitido");

  const { address } = req.body;
  if (!ethers.isAddress(address)) return res.status(400).send("Wallet inválida");

  const today = new Date().toISOString().slice(0, 10);
  const key = `${address}_${today}`;
  if (claimedToday.has(key)) return res.status(429).send("Ya reclamaste hoy");

  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(
      process.env.TOKEN_CONTRACT,
      ["function transfer(address to, uint amount) public returns (bool)"],
      wallet
    );

    const tx = await contract.transfer(address, ethers.parseUnits("1", 18));
    await tx.wait();

    claimedToday.add(key);
    res.status(200).json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al enviar Bitcococoin");
  }
}
