import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
export async function POST() {
  const options = await generateAuthenticationOptions({ rpID: process.env.NEXT_PUBLIC_RP_ID || 'localhost', userVerification: 'required' });
  const res = NextResponse.json(options);
  res.cookies.set('auth_challenge', options.challenge, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60, path: '/' });
  return res;
}
