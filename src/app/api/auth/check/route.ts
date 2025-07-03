import { NextRequest, NextResponse } from 'next/server';

// Check authentication status
export async function GET(request: NextRequest) {
  const authToken = request.cookies.get('auth_token');
  
  if (!authToken) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
  
  return NextResponse.json({ authenticated: true });
}
