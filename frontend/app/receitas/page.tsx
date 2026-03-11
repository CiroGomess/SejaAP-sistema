'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReceitaRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/receitas/cadastrar');
  }, [router]);

  return null;
}
