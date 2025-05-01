import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; // Changed import from bcrypt to bcryptjs
// import jwt from 'jsonwebtoken'; // Removed unused import
import { getRequestContext } from '@cloudflare/next-on-pages';

// Define the structure of the environment bindings provided by Cloudflare
interface Env {
  DB: D1Database;
  // JWT_SECRET is accessed via process.env as it's a var/secret, not a binding
}

// Define the expected request body structure for signup
interface SignupRequestBody {
  email?: string;
  password?: string;
  inviteCode?: string;
}

// Basic validation function (can be expanded)
function validateEmail(email: string): boolean {
  const re = /^[^"]+@[^"]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
}

export async function POST(request: NextRequest) {
  try {
    // Add type assertion for the request body
    const { email, password, inviteCode } = await request.json() as SignupRequestBody;
    const { env } = getRequestContext();
    // const { DB, JWT_SECRET } = env as Env; // JWT_SECRET is unused for now
    const { DB } = env as Env;


    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Formato de email inválido.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existingUser) {
      return NextResponse.json({ error: 'Usuário já cadastrado com este email.' }, { status: 409 });
    }

    let userRole = 'guest'; // Default role if no invite code
    let usedInviteCodeId: number | null = null;

    // Validate invite code if provided
    if (inviteCode) {
      const codeResult = await DB.prepare('SELECT id, is_used FROM invite_codes WHERE code = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)').bind(inviteCode).first<{ id: number; is_used: number }>();

      if (!codeResult) {
        return NextResponse.json({ error: 'Código de convite inválido ou expirado.' }, { status: 400 });
      }
      if (codeResult.is_used) {
        return NextResponse.json({ error: 'Código de convite já utilizado.' }, { status: 400 });
      }
      userRole = 'invited';
      usedInviteCodeId = codeResult.id;
    } else {
        // If no invite code, user starts as guest - will need payment later
        // For now, allow guest signup. Payment integration will handle role upgrade.
    }

    // Hash password using bcryptjs
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const insertResult = await DB.prepare(
      'INSERT INTO users (email, password_hash, role, invite_code_used) VALUES (?, ?, ?, ?)'
    ).bind(email, passwordHash, userRole, inviteCode || null).run();

    const userId = insertResult.meta.last_row_id;

    // Mark invite code as used if applicable
    if (usedInviteCodeId && userId) {
      await DB.prepare('UPDATE invite_codes SET is_used = TRUE, used_by_user_id = ? WHERE id = ?')
        .bind(userId, usedInviteCodeId)
        .run();
    }

    // Generate JWT token (optional, depending on session strategy)
    // const token = jwt.sign({ userId, email, role: userRole }, JWT_SECRET, { expiresIn: '1d' });

    // Return success response (without token for now, handle session separately)
    return NextResponse.json({ message: 'Usuário cadastrado com sucesso!', userId, role: userRole }, { status: 201 });

  } catch (error) {
    console.error('Signup Error:', error);
    // Check if error is D1Error and has specific code for unique constraint
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed: users.email')) {
         return NextResponse.json({ error: 'Usuário já cadastrado com este email.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor ao cadastrar usuário.' }, { status: 500 });
  }
}

