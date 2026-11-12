'use client';

import { Construction, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

export function PlaceholderPage({ title = 'Halaman ini', backHref = '/dashboard/mahasiswa' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card variant="muted">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[hsl(var(--ctp-peach)/0.35)] bg-[hsl(var(--ctp-peach)/0.12)] mb-4">
            <Construction className="h-8 w-8 text-[hsl(var(--ctp-peach))]" />
          </div>
          <h2 className="text-xl font-semibold text-[hsl(var(--ctp-text))] mb-2">
            {title} sedang dalam pengembangan
          </h2>
          <p className="text-sm text-[hsl(var(--ctp-subtext0))] mb-6 max-w-md">
            Fitur ini sedang dikerjakan dan akan segera tersedia. Terima kasih atas kesabaran Anda.
          </p>
          <Link href={backHref}>
            <Button className="ctp-focus rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-lavender)/0.30)] border border-[hsl(var(--ctp-lavender)/0.35)]" variant="secondary">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
