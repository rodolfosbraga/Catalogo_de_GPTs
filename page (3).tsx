"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { useRouter } from "next/navigation"; // Removed unused import
import { useState, useEffect } from "react"; // Import useState and useEffect

// TODO: Replace with your actual Hotmart Product Checkout URL from environment variables
const HOTMART_CHECKOUT_URL = process.env.NEXT_PUBLIC_HOTMART_CHECKOUT_URL || "https://pay.hotmart.com/EXAMPLE_CHECKOUT_CODE?checkoutMode=10&email={user_email}"; // Example URL

// This component should ideally fetch the user's email from the session/context
// For simplicity, we'll assume the email needs to be appended or is handled by Hotmart

export default function PaywallPage() {
  // const router = useRouter(); // Removed unused variable
  const [userEmail, setUserEmail] = useState(""); // State to hold user email

  // In a real app, fetch user email from context/session on component mount
  useEffect(() => {
    // Placeholder: Fetch user email from session or API
    // Example: const email = getUserEmailFromSession(); 
    // setUserEmail(email);
    setUserEmail("test@example.com"); // Replace with actual email fetching logic
  }, []);

  const handlePayment = () => {
    if (!userEmail) {
        alert("Não foi possível obter o email do usuário. Tente novamente.");
        return;
    }
    // Append email if needed by the checkout URL structure
    const checkoutUrlWithEmail = HOTMART_CHECKOUT_URL.replace("{user_email}", encodeURIComponent(userEmail));
    // Redirect the user to the Hotmart checkout page
    window.location.href = checkoutUrlWithEmail;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Acesso Exclusivo</CardTitle>
          <CardDescription>Torne-se um membro para acessar o catálogo completo de GPTs.</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>Para ter acesso ilimitado ao nosso catálogo exclusivo de GPTs, por favor, complete o pagamento seguro através da Hotmart.</p>
          <Button onClick={handlePayment} className="w-full" disabled={!userEmail}>
            Realizar Pagamento via Hotmart
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

