import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const requestBody = req.body;
    
    console.log('Use ability request:', requestBody);
    
    // 返回示例响应
    res.json({ 
      success: true,
      message: 'Ability used successfully' 
    });
  } catch (error) {
    console.error('Use ability error:', error);
    res.status(500).json({ error: 'Failed to use ability' });
  }
}