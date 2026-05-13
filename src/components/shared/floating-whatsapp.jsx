'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function FloatingWhatsApp() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const waNumber = '6285602213704';

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${waNumber}?text=${encodedMessage}`;

    window.open(url, '_blank');
    setIsOpen(false);
    setMessage('');
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen((prev) => !prev)}
          className="h-14 w-14 rounded-full border border-white/60 bg-[hsl(var(--ctp-green))] text-white shadow-[0_20px_40px_-24px_hsl(var(--ctp-green)/0.7)] hover:-translate-y-0.5 hover:bg-[hsl(var(--ctp-green)/0.92)]"
          size="icon"
          aria-label="Chat via WhatsApp"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 flex w-80 flex-col overflow-hidden rounded-[28px] border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.92)] shadow-[0_24px_56px_-30px_hsl(var(--ctp-sapphire)/0.42)] backdrop-blur-xl sm:w-96"
          >
            <div className="bg-[linear-gradient(135deg,hsl(var(--ctp-green)),hsl(var(--ctp-teal)))] p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Hubungi Support</h3>
                  <p className="text-xs text-white/84">Biasanya membalas dalam beberapa menit</p>
                </div>
              </div>
            </div>

            <div className="bg-[hsl(var(--ctp-mantle)/0.5)] p-4">
              <div className="w-10/12 rounded-2xl rounded-tl-none border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-surface0))] p-3 text-sm text-[hsl(var(--ctp-text))] shadow-sm">
                Halo! Ada yang bisa kami bantu seputar Kavanahub?
              </div>
            </div>

            <div className="border-t border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base))] p-3">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  className="rounded-full bg-[hsl(var(--ctp-crust))] focus-visible:ring-[hsl(var(--ctp-green)/0.35)]"
                  placeholder="Ketik pesan Anda..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={!message.trim()}
                  className="h-10 w-10 shrink-0 rounded-full bg-[hsl(var(--ctp-green))] shadow-sm hover:bg-[hsl(var(--ctp-green)/0.92)] disabled:opacity-50"
                  size="icon"
                >
                  <Send className="mt-0.5 h-4 w-4 -ml-0.5 text-white" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
