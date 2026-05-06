import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Flame className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-display text-4xl font-black text-foreground mb-2">404</h1>
        <p className="text-muted-foreground mb-6">Página não encontrada. Parece que você se perdeu na masmorra.</p>
        <Link to="/">
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Início
          </Button>
        </Link>
      </div>
    </div>
  );
}