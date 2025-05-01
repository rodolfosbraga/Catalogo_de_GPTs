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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data: unknown = await response.json(); // Get response as unknown first

      if (!response.ok) {
        // Type guard to check if data is an object and has an error property
        const errorMessage = (typeof data === 'object' && data !== null && 'error' in data && typeof (data as ApiErrorResponse).error === 'string')
          ? (data as ApiErrorResponse).error
          : 'Falha no login';
        throw new Error(errorMessage);
      }

      // Login successful, redirect to home or dashboard
      router.push('/'); // Redirect to the main catalog page after login
      // Optionally, refresh the page or use a state management library to update UI
      router.refresh(); 

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
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Acesse o Catálogo de GPTs</CardDescription>
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
                placeholder="Sua senha" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p>Não tem uma conta? <Link href="/signup" className="text-blue-600 hover:underline">Cadastre-se</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}

