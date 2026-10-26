import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
export async function POST(req: Request) {
  try {
    const { qrToken, eventType, assertionResponse } = await req.json();
    const cookieStore = cookies();
    const expectedChallenge = cookieStore.get('auth_challenge')?.value;
    if (!expectedChallenge) return NextResponse.json({ error: 'Challenge expirado' }, { status: 400 });
    const { data: authRecord } = await supabaseAdmin.from('user_authenticators').select('*').eq('credential_id', assertionResponse.id).single();
    if (!authRecord) return NextResponse.json({ error: 'Dispositivo no reconocido' }, { status: 404 });
    const verification = await verifyAuthenticationResponse({ response: assertionResponse, expectedChallenge, expectedOrigin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', expectedRPID: process.env.NEXT_PUBLIC_RP_ID || 'localhost', authenticator: { credentialID: authRecord.credential_id, credentialPublicKey: Buffer.from(authRecord.public_key), counter: Number(authRecord.counter) } });
    if (!verification.verified) return NextResponse.json({ error: 'Firma biométrica inválida' }, { status: 401 });
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('process_attendance', { p_user_id: authRecord.user_id, p_terminal_qr: qrToken, p_event_type: eventType, p_new_counter: verification.authenticationInfo.newCounter, p_credential_id: authRecord.credential_id });
    if (rpcError || !rpcResult.success) return NextResponse.json({ error: rpcResult?.error || rpcError?.message }, { status: 400 });
    const res = NextResponse.json({ success: true, logId: rpcResult.log_id });
    res.cookies.delete('auth_challenge');
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
