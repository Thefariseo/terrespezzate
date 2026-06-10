export default function handler(req, res) {
  res.status(200).json({ ok: true, app: 'le-terre-spezzate-ascension', runtime: 'vercel-serverless', time: new Date().toISOString() });
}
