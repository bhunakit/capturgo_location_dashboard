import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Get admin password from environment variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;
    
    // Validate password
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      );
    }
    
    // Set secure HTTP-only cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('auth_token', 'authenticated', { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Logout endpoint
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('auth_token');
  
  return response;
}
