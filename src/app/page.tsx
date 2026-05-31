'use client';

import dynamic from 'next/dynamic';

const PosApp = dynamic(() => import('@/components/PosApp'), { ssr: false });

export default function HomePage() {
  return <PosApp />;
}
