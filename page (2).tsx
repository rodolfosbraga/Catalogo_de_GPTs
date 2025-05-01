"use client";

import catalogData from "@/lib/catalog_data.json";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
// Removed unused CardDescription import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; 
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface GptItem {
  name: string;
  link: string | null;
  description: string | null;
  tools: string | null;
  prompt_ideal: string | null;
}

interface Category {
  category: string;
  gpts: GptItem[];
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<Category[]>(catalogData);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    // Assuming catalogData is static and doesn't change, it's safe to use it directly
    const currentCatalogData = catalogData as Category[]; 
    // Fixed the unterminated string constant below
    if (lowerCaseSearchTerm === '') { 
      setFilteredData(currentCatalogData);
    } else {
      const filtered = currentCatalogData.map(category => ({
        ...category,
        gpts: category.gpts.filter(gpt => 
          gpt.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          (gpt.description && gpt.description.toLowerCase().includes(lowerCaseSearchTerm))
        )
      })).filter(category => category.gpts.length > 0);
      setFilteredData(filtered);
    }
  // Removed catalogData from dependency array as it's likely static JSON import
  }, [searchTerm]); 

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 lg:p-24 bg-gray-50">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">Catálogo de GPTs</h1>
        <p className="text-center text-gray-600 mb-8">Bem-vindo(a)! Encontre assistentes de IA organizados por categoria.</p>
        
        <Input 
          type="text"
          placeholder="Pesquise um GPT por nome ou descrição..."
          className="mb-8 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {filteredData.length > 0 ? (
          <div className="space-y-6">
            {filteredData.map((category, index) => (
              <Card key={index} className="shadow-md border border-gray-200 rounded-lg overflow-hidden">
                <CardHeader className="bg-gray-100 p-4 border-b border-gray-200">
                  <CardTitle className="text-xl font-semibold text-gray-700">{category.category}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Accordion type="single" collapsible className="w-full">
                    {category.gpts.map((gpt, gptIndex) => (
                      <AccordionItem key={gptIndex} value={`item-${index}-${gptIndex}`} className="border-b border-gray-200 last:border-b-0">
                        <AccordionTrigger className="text-lg font-medium text-blue-700 hover:text-blue-800 py-3">
                          {gpt.name}
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4 text-gray-700 space-y-2">
                          {gpt.description && <p><strong>Descrição:</strong> {gpt.description}</p>}
                          {gpt.tools && <p><strong>Ferramentas:</strong> {gpt.tools}</p>}
                          {gpt.prompt_ideal && <p><strong>Prompt Ideal:</strong> {gpt.prompt_ideal}</p>}
                          {gpt.link && (
                            <p><strong>Link:</strong> <Link href={gpt.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Acessar GPT</Link></p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Escaped quotes
          <p className="text-center text-gray-500 mt-10">Nenhum GPT encontrado para &quot;{searchTerm}&quot;.</p> 
        )}

        <footer className="text-center mt-12 pt-6 border-t border-gray-300 text-gray-500 text-sm">
          Desenvolvido por Manus
        </footer>
      </div>
    </main>
  );
}

