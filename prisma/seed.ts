import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { INITIAL_AMENITY_ITEMS, INITIAL_FOOD_ITEMS, INITIAL_ROOMS } from '../src/data';
import { DEFAULT_DISCOUNT_SETTINGS } from '../src/types';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function main() {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const username =
      process.env.NEXT_PUBLIC_INITIAL_SUPER_ADMIN_USERNAME?.trim() || 'admin';
    const password =
      process.env.INITIAL_SUPER_ADMIN_PASSWORD?.trim() || 'change-me';
    const displayName =
      process.env.NEXT_PUBLIC_INITIAL_SUPER_ADMIN_NAME?.trim() || 'Super Admin';

    await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        passwordHash: await hashPassword(password),
        role: 'super_admin',
        displayName,
        active: true,
      },
    });
    console.log(`Created super admin: ${username}`);
  }

  const roomCount = await prisma.room.count();
  if (roomCount === 0) {
    await prisma.room.createMany({
      data: INITIAL_ROOMS.map(room => ({
        name: room.name,
        type: room.type === 'Family Suite' ? 'Family_Suite' : room.type,
        pricePerNight: room.pricePerNight,
        status: room.status,
        roomNumber: room.roomNumber,
      })),
    });
    console.log(`Seeded ${INITIAL_ROOMS.length} rooms`);
  }

  const foodCount = await prisma.foodItem.count();
  if (foodCount === 0) {
    await prisma.foodItem.createMany({
      data: INITIAL_FOOD_ITEMS.map(item => ({
        name: item.name,
        price: item.price,
        category: item.category,
        available: item.available,
      })),
    });
    console.log(`Seeded ${INITIAL_FOOD_ITEMS.length} food items`);
  }

  const amenityCount = await prisma.amenityItem.count();
  if (amenityCount === 0) {
    await prisma.amenityItem.createMany({
      data: INITIAL_AMENITY_ITEMS.map(item => ({
        name: item.name,
        price: item.price,
        category: item.category,
        available: item.available,
      })),
    });
    console.log(`Seeded ${INITIAL_AMENITY_ITEMS.length} amenity items`);
  }

  await prisma.terminalSettings.upsert({
    where: { singletonKey: 'default' },
    update: {},
    create: {
      singletonKey: 'default',
      currency: 'USD',
      taxRate: 5,
      serviceChargeRate: 10,
      printerType: 'Thermal_80mm',
      stationId: 'FRONT-DESK-04',
      operatorName: 'Sarah Jenkins',
      soundEnabled: true,
    },
  });

  await prisma.discountSettings.upsert({
    where: { singletonKey: 'default' },
    update: {},
    create: {
      singletonKey: 'default',
      autoRules: DEFAULT_DISCOUNT_SETTINGS.autoRules.map(r => ({
        minNights: r.minNights,
        discountPercent: r.discountPercent,
      })),
      manualOptions: DEFAULT_DISCOUNT_SETTINGS.manualOptions,
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
