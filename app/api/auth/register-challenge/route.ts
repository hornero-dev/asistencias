import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
export async function POST(req: Request) {
  const { enrollmentToken } = await req.json();
  const { data: invite } = await supabaseAdmin.from('enrollment_invitations').select('*, profiles(id, full_name, email)').eq('token', enrollmentToken).eq('is_used', false).single();
  if (!invite) return NextResponse.json({ error: 'Invitación inválida' }, { status: 400 });
  const options = await generateRegistrationOptions({ rpName: 'Control Asistencia', rpID: process.env.NEXT_PUBLIC_RP_ID || 'localhost', userID: invite.profiles.id, userName: invite.profiles.email || invite.profiles.full_name, attestationType: 'none', authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' } });
  await supabaseAdmin.from('enrollment_invitations').update({ current_challenge: options.challenge }).eq('id', invite.id);
  return NextResponse.json(options);
}
