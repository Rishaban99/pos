import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, requireSession } from '@/lib/auth-server';
import { mapCustomer } from '@/lib/mappers';
import type { CustomerSnapshot } from '@/types';

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (session instanceof NextResponse) return session;

  const customers = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(customers.map(mapCustomer));
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = (await request.json()) as CustomerSnapshot;
    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email,
        idNumber: body.idNumber,
      },
    });
    return NextResponse.json(mapCustomer(customer), { status: 201 });
  } catch {
    return jsonError('Failed to create customer.', 500);
  }
}
