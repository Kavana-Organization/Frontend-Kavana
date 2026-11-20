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
          <div className="grid h-16 w-16 place-items-center rounded-xl border border-[hsl(var(--ctp-peach)/0.35)] bg-[hsl(var(--ctp-peach)/0.12)] mb-4">
            <Construction className="h-8 w-8 text-[hsl(var(--ctp-peach))]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-strong)] mb-2">
            {title} sedang dalam pengembangan
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6 max-w-md">
            Fitur ini sedang dikerjakan dan akan segera tersedia. Terima kasih atas kesabaran Anda.
          </p>
          <Link href={backHref}>
            <Button className="ctp-focus rounded-lg bg-[var(--surface-sunken)] text-[var(--text-strong)] hover:bg-[var(--surface-sunken)]/80 border border-[var(--line)]" variant="secondary">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
