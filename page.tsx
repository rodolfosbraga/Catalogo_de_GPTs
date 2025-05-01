"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';

// Define a type for the expected error response from the API
interface ApiErrorResponse {
  error?: string;
}

// Define a type for the expected success response from the API
interface ApiSuccessResponse {
  message?: string;
  userId?: number;
  role?: string;
}

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, inviteCode: inviteCode || undefined }), // Send inviteCode only if it has value
      });

      const data: unknown = await response.json(); // Get response as unknown first

      if (!response.ok) {
        // Type guard to check if data is an object and has an error property
        const errorMessage = (typeof data === 'object' && data !== null && 'error' in data && typeof (data as ApiErrorResponse).error === 'string')
          ? (data as ApiErrorResponse).error
          : 'Falha no cadastro';
        throw new Error(errorMessage);
      }

      // Signup successful
      const successMsg = (typeof data === 'object' && data !== null && 'message' in data && typeof (data as ApiSuccessResponse).message === 'string')
        ? (data as ApiSuccessResponse).message
        : 'Cadastro realizado com sucesso!';
      setSuccessMessage(`${successMsg} Você será redirecionado para o login.`);
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 3000); // 3 seconds delay

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro desconhecido.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Cadastro</CardTitle>
          <CardDescription>Crie sua conta para acessar o catálogo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email">Email</label>
              <Input 
                id="email"
                type="email" 
                placeholder="seu@email.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password">Senha</label>
              <Input 
                id="password"
                type="password" 
                placeholder="Crie uma senha (mín. 6 caracteres)" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword">Confirmar Senha</label>
              <Input 
                id="confirmPassword"
                type="password" 
                placeholder="Confirme sua senha" 
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="inviteCode">Código de Convite (Opcional)</label>
              <Input 
                id="inviteCode"
                type="text" 
                placeholder="Seu código de convite" 
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p>Já tem uma conta? <Link href="/login" className="text-blue-600 hover:underline">Faça login</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}

