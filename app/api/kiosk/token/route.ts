import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import crypto from 'crypto';
export async function POST(req: Request) {
  try {
    const { terminalId } = await req.json();
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 1000).toISOString();
    await supabaseAdmin.from('terminal_qr_tokens').insert({ terminal_id: terminalId, token, expires_at: expiresAt, is_used: false });
    return NextResponse.json({ token, expiresAt, ttlSeconds: 30 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
