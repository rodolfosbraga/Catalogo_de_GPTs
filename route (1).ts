import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; // Changed import from bcrypt to bcryptjs
import jwt from 'jsonwebtoken';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { serialize } from 'cookie';

// Define the structure of the environment bindings provided by Cloudflare
interface Env {
  DB: D1Database;
  // JWT_SECRET is accessed via process.env as it's a var/secret, not a binding
}

// Define the expected request body structure
interface LoginRequestBody {
  email?: string;
  password?: string;
}

// Basic validation function (can be expanded)
function validateEmail(email: string): boolean {
  const re = /^[^"]+@[^"]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
}

export async function POST(request: NextRequest) {
  try {
    // Add type assertion for the request body
    const { email, password } = await request.json() as LoginRequestBody;
    const { env } = getRequestContext();
    const { DB } = env as Env; // Get D1 binding

    // Get JWT_SECRET from environment variables/secrets
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        console.error('JWT_SECRET environment variable not set.');
        return NextResponse.json({ error: 'Configuração interna do servidor incompleta.' }, { status: 500 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Formato de email inválido.' }, { status: 400 });
    }

    // Find user by email
    const user = await DB.prepare('SELECT id, email, password_hash, role FROM users WHERE email = ?').bind(email).first<{ id: number; email: string; password_hash: string; role: string }>();

    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 }); // User not found
    }

    // Compare password using bcryptjs
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 }); // Incorrect password
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: '1d' }); // Expires in 1 day

    // Set token in HTTP-only cookie
    const cookie = serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
      sameSite: 'lax', // Protect against CSRF
      maxAge: 60 * 60 * 24, // 1 day in seconds
      path: '/', // Cookie available across the entire site
    });

    // Return success response with the cookie
    const response = NextResponse.json({ message: 'Login bem-sucedido!', role: user.role }, { status: 200 });
    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao fazer login.' }, { status: 500 });
  }
}

