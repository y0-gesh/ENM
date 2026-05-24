import { PrismaClient, Role, BookingStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean old data in safe sequence
  await prisma.review.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.providerProfile.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('🗑️  Cleaned existing database tables.');

  // Common password hash
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create Users (Clients)
  const clientYogesh = await prisma.user.create({
    data: {
      name: 'Yogesh',
      email: 'yogesh@example.com',
      passwordHash,
      role: Role.USER,
    },
  });

  const clientAmit = await prisma.user.create({
    data: {
      name: 'Amit Sharma',
      email: 'amit@example.com',
      passwordHash,
      role: Role.USER,
    },
  });

  console.log('👤 Created users/clients.');

  // Create Provider Users and Profiles
  // Center is near Yogesh's active coordinates: 21.2372, 81.6894
  const providersData = [
    {
      name: 'Yashwant',
      email: 'yashwant@example.com',
      serviceCategory: 'Electrician',
      bio: 'Expert electrician with 10+ years of experience in residential and commercial wiring, appliance repair, and smart home setup.',
      latitude: 21.2375,
      longitude: 81.6894, // very close (~30m)
      avgRating: 4.8,
      completedJobs: 45,
      serviceRadius: 10.0,
    },
    {
      name: 'Rajesh Plumber',
      email: 'rajesh@example.com',
      serviceCategory: 'Plumber',
      bio: 'Professional plumbing services. Specializes in leak detection, pipe replacement, drain cleaning, and bathroom fitting installation.',
      latitude: 21.2422,
      longitude: 81.6935, // ~700m away
      avgRating: 4.6,
      completedJobs: 32,
      serviceRadius: 15.0,
    },
    {
      name: 'Sunita Cleaners',
      email: 'sunita@example.com',
      serviceCategory: 'Cleaner',
      bio: 'Eco-friendly deep cleaning services for apartments, villas, and offices. Reliable, sanitized, and fully equipped team.',
      latitude: 21.2285,
      longitude: 81.6812, // ~1.3km away
      avgRating: 4.9,
      completedJobs: 88,
      serviceRadius: 25.0,
    },
    {
      name: 'Vikram Locksmith',
      email: 'vikram@example.com',
      serviceCategory: 'Locksmith',
      bio: '24/7 emergency locksmith services. Lock picking, key duplication, smart lock installations, and car unlocking.',
      latitude: 21.2498,
      longitude: 81.7011, // ~1.8km away
      avgRating: 4.3,
      completedJobs: 15,
      serviceRadius: 12.0,
    },
    {
      name: 'Karan HVAC Services',
      email: 'karan@example.com',
      serviceCategory: 'HVAC',
      bio: 'AC and heating specialists. Repair, maintenance, gas filling, and new installation services with service guarantee.',
      latitude: 21.2154,
      longitude: 81.6702, // ~3.2km away
      avgRating: 4.7,
      completedJobs: 60,
      serviceRadius: 20.0,
    },
    {
      name: 'Ravi Electric & AC',
      email: 'ravi@example.com',
      serviceCategory: 'Electrician',
      bio: 'Quick and efficient domestic electrical works, ceiling fan installations, short circuit fixes, and air conditioner servicing.',
      latitude: 21.2588,
      longitude: 81.6801, // ~2.6km away
      avgRating: 4.5,
      completedJobs: 28,
      serviceRadius: 15.0,
    },
  ];

  console.log('⚡ Creating service provider profiles...');
  for (const prov of providersData) {
    const user = await prisma.user.create({
      data: {
        name: prov.name,
        email: prov.email,
        passwordHash,
        role: Role.PROVIDER,
      },
    });

    // Score formula: (avgRating * 0.5) + (ln(completedJobs + 1) * 0.3)
    const score = (prov.avgRating * 0.5) + (Math.log(prov.completedJobs + 1) * 0.3);

    await prisma.providerProfile.create({
      data: {
        userId: user.id,
        bio: prov.bio,
        serviceCategory: prov.serviceCategory,
        serviceRadius: prov.serviceRadius,
        latitude: prov.latitude,
        longitude: prov.longitude,
        avgRating: prov.avgRating,
        completedJobs: prov.completedJobs,
        score: parseFloat(score.toFixed(4)),
        isAvailable: true,
      },
    });
  }

  // Fetch created profiles to link bookings/reviews
  const profiles = await prisma.providerProfile.findMany({
    include: { user: true },
  });

  // Create a few past bookings & reviews to show on Yashwant's profile (since Yashwant is the highlighted provider)
  const yashwantProfile = profiles.find((p) => p.user.name === 'Yashwant');
  if (yashwantProfile) {
    console.log('📅 Seeding mock bookings and reviews for Yashwant...');
    
    // Booking 1 - Completed
    const booking1 = await prisma.booking.create({
      data: {
        userId: clientYogesh.id,
        providerId: yashwantProfile.id,
        status: BookingStatus.COMPLETED,
        scheduledAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
        completedAt: new Date(Date.now() - 47 * 60 * 60 * 1000),
        notes: 'Need to fix living room chandelier and check kitchen sockets.',
      },
    });

    await prisma.review.create({
      data: {
        bookingId: booking1.id,
        reviewerId: clientYogesh.id,
        providerId: yashwantProfile.id,
        rating: 5,
        comment: 'Yashwant arrived right on time and fixed all electrical issues within an hour! Extremely polite and professional. Highly recommended!',
      },
    });

    // Booking 2 - Completed
    const booking2 = await prisma.booking.create({
      data: {
        userId: clientAmit.id,
        providerId: yashwantProfile.id,
        status: BookingStatus.COMPLETED,
        scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        completedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
        notes: 'AC power socket sparking.',
      },
    });

    await prisma.review.create({
      data: {
        bookingId: booking2.id,
        reviewerId: clientAmit.id,
        providerId: yashwantProfile.id,
        rating: 4,
        comment: 'Quick and safe repair of sparking sockets. Explained what was wrong and how to avoid it.',
      },
    });

    // Booking 3 - Pending
    await prisma.booking.create({
      data: {
        userId: clientYogesh.id,
        providerId: yashwantProfile.id,
        status: BookingStatus.PENDING,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        notes: 'Need a smart doorbell installation.',
      },
    });
  }

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
