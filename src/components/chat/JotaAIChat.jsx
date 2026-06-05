import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';

const SYSTEM_PROMPT = `Você é o Jota, treinador fitness do app Jota Fit. Tom: direto, motivador sem bajulação, didático, seguro.
Crenças: progressão > aleatoriedade, consistência > perfeição, técnica > ego.
Se houver risco (dor aguda, tontura), peça para parar e falar com o Jota real ou buscar atendimento.
Responda em português.`;

export default function JotaAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useCurrentUser();
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    if (!isOpen || !user?.email || !db) return;

    const q = query(
      collection(db, 'chats', user.email, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return unsubscribe;
  }, [isOpen, user?.email]);

  if (!isFirebaseConfigured) return null;

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading || !user?.email || !db) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      await addDoc(collection(db, 'chats', user.email, 'messages'), {
        role: 'user',
        text: userMessage,
        createdAt: serverTimestamp(),
      });

      const q = query(
        collection(db, 'chats', user.email, 'messages'),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map((doc) => doc.data()).slice(-10);

      const contents = history.map((msg) => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.text }],
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, systemInstruction: SYSTEM_PROMPT }),
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();

      await addDoc(collection(db, 'chats', user.email, 'messages'), {
        role: 'ai',
        text: data.text,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[JotaAIChat]', error);
      await addDoc(collection(db, 'chats', user.email, 'messages'), {
        role: 'ai',
        text: 'Foi mal, a conexão falhou aqui. Repete aí, por favor.',
        createdAt: serverTimestamp(),
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all z-50"
        aria-label="Abrir chat com IA do Jota"
      >
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-20 right-4 w-80 sm:w-96 h-[500px] flex flex-col shadow-2xl z-50 overflow-hidden border-primary/20">
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-bold">IA do Jota</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="hover:bg-primary-foreground/20 p-1 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-muted/30">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-10">
            E aí, bora treinar? Me fala seu objetivo ou se precisa de ajuste no treino.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-card border shadow-sm rounded-tl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border shadow-sm rounded-xl p-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t bg-card flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mande sua dúvida..."
          className="flex-1 bg-muted rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-primary text-primary-foreground p-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </Card>
  );
}