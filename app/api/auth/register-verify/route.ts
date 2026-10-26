import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
export async function POST(req: Request) {
  const { enrollmentToken, response, deviceName } = await req.json();
  const { data: invite } = await supabaseAdmin.from('enrollment_invitations').select('*').eq('token', enrollmentToken).eq('is_used', false).single();
  if (!invite || !invite.current_challenge) return NextResponse.json({ error: 'Sesión no válida' }, { status: 400 });
  const verification = await verifyRegistrationResponse({ response, expectedChallenge: invite.current_challenge, expectedOrigin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', expectedRPID: process.env.NEXT_PUBLIC_RP_ID || 'localhost' });
  if (!verification.verified || !verification.registrationInfo) return NextResponse.json({ error: 'Validación fallida' }, { status: 400 });
  const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
  await supabaseAdmin.from('user_authenticators').insert({ user_id: invite.user_id, credential_id: credentialID, public_key: Buffer.from(credentialPublicKey), counter, device_name: deviceName });
  await supabaseAdmin.from('enrollment_invitations').update({ is_used: true, current_challenge: null }).eq('id', invite.id);
  return NextResponse.json({ success: true });
}
