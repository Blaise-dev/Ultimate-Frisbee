import { PrismaClient, UserRole, AthleteCategory, AthleteLevel, GroupType, SessionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'demo1234';

const users = {
  admins: [
    { email: 'admin.demo1@ultimate.local', firstName: 'Alice', lastName: 'Ndiaye' },
    { email: 'admin.demo2@ultimate.local', firstName: 'Marc', lastName: 'Diallo' },
  ],
  coaches: [
    { email: 'coach.demo1@ultimate.local', firstName: 'Kevin', lastName: 'Martin', specialization: 'Offense', experienceYears: 6 },
    { email: 'coach.demo2@ultimate.local', firstName: 'Sonia', lastName: 'Diop', specialization: 'Defense', experienceYears: 4 },
    { email: 'coach.demo3@ultimate.local', firstName: 'Rayan', lastName: 'Bamba', specialization: 'Conditioning', experienceYears: 8 },
  ],
  athletes: [
    { email: 'athlete.demo1@ultimate.local', firstName: 'Lina', lastName: 'Faye', category: AthleteCategory.SENIOR, level: AthleteLevel.INTERMEDIATE },
    { email: 'athlete.demo2@ultimate.local', firstName: 'Noah', lastName: 'Sy', category: AthleteCategory.SENIOR, level: AthleteLevel.ADVANCED },
    { email: 'athlete.demo3@ultimate.local', firstName: 'Ines', lastName: 'Barry', category: AthleteCategory.JUNIOR, level: AthleteLevel.BEGINNER },
    { email: 'athlete.demo4@ultimate.local', firstName: 'Moussa', lastName: 'Lo', category: AthleteCategory.SENIOR, level: AthleteLevel.EXPERT },
    { email: 'athlete.demo5@ultimate.local', firstName: 'Sara', lastName: 'Gueye', category: AthleteCategory.VETERAN, level: AthleteLevel.INTERMEDIATE },
    { email: 'athlete.demo6@ultimate.local', firstName: 'Yanis', lastName: 'Sow', category: AthleteCategory.SENIOR, level: AthleteLevel.BEGINNER },
    { email: 'athlete.demo7@ultimate.local', firstName: 'Lea', lastName: 'Camara', category: AthleteCategory.JUNIOR, level: AthleteLevel.INTERMEDIATE },
    { email: 'athlete.demo8@ultimate.local', firstName: 'Idriss', lastName: 'Kane', category: AthleteCategory.SENIOR, level: AthleteLevel.ADVANCED },
    { email: 'athlete.demo9@ultimate.local', firstName: 'Aya', lastName: 'Traore', category: AthleteCategory.SENIOR, level: AthleteLevel.ADVANCED },
    { email: 'athlete.demo10@ultimate.local', firstName: 'Hamza', lastName: 'Ba', category: AthleteCategory.VETERAN, level: AthleteLevel.EXPERT },
  ],
};

async function upsertAdmin(email: string) {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  return prisma.user.upsert({
    where: { email },
    update: {
      role: UserRole.ADMIN,
      password: hashedPassword,
      isBanned: false,
      isDeleted: false,
    },
    create: {
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });
}

async function upsertCoach(input: typeof users.coaches[number]) {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      role: UserRole.COACH,
      password: hashedPassword,
      isBanned: false,
      isDeleted: false,
      coach: {
        upsert: {
          update: {
            firstName: input.firstName,
            lastName: input.lastName,
            specialization: input.specialization,
            experienceYears: input.experienceYears,
          },
          create: {
            firstName: input.firstName,
            lastName: input.lastName,
            specialization: input.specialization,
            experienceYears: input.experienceYears,
          },
        },
      },
    },
    create: {
      email: input.email,
      password: hashedPassword,
      role: UserRole.COACH,
      coach: {
        create: {
          firstName: input.firstName,
          lastName: input.lastName,
          specialization: input.specialization,
          experienceYears: input.experienceYears,
        },
      },
    },
    include: { coach: true },
  });
}

async function upsertAthlete(input: typeof users.athletes[number]) {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      role: UserRole.ATHLETE,
      password: hashedPassword,
      isBanned: false,
      isDeleted: false,
      athlete: {
        upsert: {
          update: {
            firstName: input.firstName,
            lastName: input.lastName,
            category: input.category,
            level: input.level,
          },
          create: {
            firstName: input.firstName,
            lastName: input.lastName,
            category: input.category,
            level: input.level,
          },
        },
      },
    },
    create: {
      email: input.email,
      password: hashedPassword,
      role: UserRole.ATHLETE,
      athlete: {
        create: {
          firstName: input.firstName,
          lastName: input.lastName,
          category: input.category,
          level: input.level,
        },
      },
    },
    include: { athlete: true },
  });
}

async function findOrCreateGroup(name: string, type: GroupType, coachId: string, sportId: string, description: string) {
  const existing = await prisma.group.findFirst({
    where: { name, type },
  });

  if (existing) {
    return prisma.group.update({
      where: { id: existing.id },
      data: {
        coachId,
        sportId,
        description,
      },
    });
  }

  return prisma.group.create({
    data: {
      name,
      type,
      coachId,
      sportId,
      description,
    },
  });
}

async function main() {
  console.log('🌱 Seeding demo data...');

  const sport = await prisma.sport.upsert({
    where: { name: 'Ultimate Frisbee' },
    update: {
      description: 'Sport collectif auto-arbitré basé sur la circulation du disque.',
      themes: ['THROWING', 'CATCHING', 'POSITIONING', 'DEFENSE', 'CARDIO'],
      isActive: true,
    },
    create: {
      name: 'Ultimate Frisbee',
      description: 'Sport collectif auto-arbitré basé sur la circulation du disque.',
      themes: ['THROWING', 'CATCHING', 'POSITIONING', 'DEFENSE', 'CARDIO'],
      isActive: true,
    },
  });

  for (const admin of users.admins) {
    await upsertAdmin(admin.email);
  }

  const coachUsers = [];
  for (const coach of users.coaches) {
    const coachUser = await upsertCoach(coach);
    coachUsers.push(coachUser);
  }

  const athleteUsers = [];
  for (const athlete of users.athletes) {
    const athleteUser = await upsertAthlete(athlete);
    athleteUsers.push(athleteUser);
  }

  const coachProfiles = coachUsers.map((user) => user.coach).filter(Boolean);
  const athleteProfiles = athleteUsers.map((user) => user.athlete).filter(Boolean);

  if (coachProfiles.length < 3 || athleteProfiles.length < 10) {
    throw new Error('Impossible de créer les profils coachs/athlètes de démo');
  }

  const groupElite = await findOrCreateGroup(
    'DEMO - Elite Squad',
    GroupType.COMPETITION,
    coachProfiles[0]!.id,
    sport.id,
    'Groupe performance orienté compétition nationale'
  );

  const groupAcademy = await findOrCreateGroup(
    'DEMO - Academy',
    GroupType.TRAINING,
    coachProfiles[1]!.id,
    sport.id,
    'Groupe apprentissage et progression technique'
  );

  const groupFun = await findOrCreateGroup(
    'DEMO - Sunday Fun',
    GroupType.LEISURE,
    coachProfiles[2]!.id,
    sport.id,
    'Groupe loisir du dimanche'
  );

  await prisma.athleteGroup.createMany({
    data: [
      { athleteId: athleteProfiles[0]!.id, groupId: groupElite.id },
      { athleteId: athleteProfiles[1]!.id, groupId: groupElite.id },
      { athleteId: athleteProfiles[2]!.id, groupId: groupAcademy.id },
      { athleteId: athleteProfiles[3]!.id, groupId: groupElite.id },
      { athleteId: athleteProfiles[4]!.id, groupId: groupFun.id },
      { athleteId: athleteProfiles[5]!.id, groupId: groupAcademy.id },
      { athleteId: athleteProfiles[6]!.id, groupId: groupAcademy.id },
      { athleteId: athleteProfiles[7]!.id, groupId: groupElite.id },
      { athleteId: athleteProfiles[8]!.id, groupId: groupFun.id },
      { athleteId: athleteProfiles[9]!.id, groupId: groupFun.id },
    ],
    skipDuplicates: true,
  });

  const now = new Date();
  const trainingStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 18, 30);
  const trainingEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 20, 0);
  const matchStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 10, 0);
  const matchEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 12, 0);

  const trainingSession = await prisma.session.upsert({
    where: { id: 'seed-training-session' },
    update: {
      title: 'DEMO - Entraînement Intensif',
      type: SessionType.TRAINING,
      coachId: coachProfiles[0]!.id,
      sportId: sport.id,
      startTime: trainingStart,
      endTime: trainingEnd,
      location: 'Stade Universitaire - Terrain 1',
      description: 'Séance axée cardio + précision de passes',
      isRecurrent: true,
      recurrence: 'weekly',
    },
    create: {
      id: 'seed-training-session',
      title: 'DEMO - Entraînement Intensif',
      type: SessionType.TRAINING,
      coachId: coachProfiles[0]!.id,
      sportId: sport.id,
      startTime: trainingStart,
      endTime: trainingEnd,
      location: 'Stade Universitaire - Terrain 1',
      description: 'Séance axée cardio + précision de passes',
      isRecurrent: true,
      recurrence: 'weekly',
    },
  });

  const matchSession = await prisma.session.upsert({
    where: { id: 'seed-match-session' },
    update: {
      title: 'DEMO - Match Amical Interclubs',
      type: SessionType.MATCH,
      coachId: coachProfiles[1]!.id,
      sportId: sport.id,
      startTime: matchStart,
      endTime: matchEnd,
      location: 'Stade Municipal - Terrain Central',
      description: 'Match amical avec suivi de stats individuelles',
      isRecurrent: false,
      recurrence: null,
    },
    create: {
      id: 'seed-match-session',
      title: 'DEMO - Match Amical Interclubs',
      type: SessionType.MATCH,
      coachId: coachProfiles[1]!.id,
      sportId: sport.id,
      startTime: matchStart,
      endTime: matchEnd,
      location: 'Stade Municipal - Terrain Central',
      description: 'Match amical avec suivi de stats individuelles',
      isRecurrent: false,
      recurrence: null,
    },
  });

  await prisma.athleteSession.createMany({
    data: athleteProfiles.map((athlete) => ({
      athleteId: athlete!.id,
      sessionId: trainingSession.id,
      status: 'registered',
    })),
    skipDuplicates: true,
  });

  await prisma.athleteSession.createMany({
    data: athleteProfiles.slice(0, 7).map((athlete) => ({
      athleteId: athlete!.id,
      sessionId: matchSession.id,
      status: 'registered',
    })),
    skipDuplicates: true,
  });

  await prisma.activity.deleteMany({ where: { sessionId: trainingSession.id } });
  await prisma.activity.deleteMany({ where: { sessionId: matchSession.id } });

  const trainingActivities = await prisma.activity.createManyAndReturn({
    data: [
      {
        sessionId: trainingSession.id,
        name: 'Échauffement dynamique',
        theme: 'CARDIO',
        description: 'Mobilité + accélérations progressives',
        duration: 20,
        order: 1,
      },
      {
        sessionId: trainingSession.id,
        name: 'Atelier passes longues',
        theme: 'THROWING',
        description: 'Travail backhand / forehand sous pression',
        duration: 35,
        order: 2,
      },
      {
        sessionId: trainingSession.id,
        name: 'Jeu réduit 5v5',
        theme: 'POSITIONING',
        description: 'Occupation des espaces et transitions rapides',
        duration: 40,
        order: 3,
      },
    ],
  });

  const matchActivities = await prisma.activity.createManyAndReturn({
    data: [
      {
        sessionId: matchSession.id,
        name: 'Warm-up pré-match',
        theme: 'CARDIO',
        description: 'Activation neuromusculaire',
        duration: 25,
        order: 1,
      },
      {
        sessionId: matchSession.id,
        name: 'Match - 1ère mi-temps',
        theme: 'COMPETITION',
        description: 'Suivi de la performance offensive',
        duration: 45,
        order: 2,
      },
      {
        sessionId: matchSession.id,
        name: 'Match - 2ème mi-temps',
        theme: 'COMPETITION',
        description: 'Ajustements défensifs et finition',
        duration: 45,
        order: 3,
      },
    ],
  });

  const allActivities = [...trainingActivities, ...matchActivities];

  for (const activity of allActivities) {
    await prisma.activityPerformanceData.deleteMany({ where: { activityId: activity.id } });

    await prisma.activityPerformanceData.createMany({
      data: athleteProfiles.slice(0, 6).flatMap((athlete, index) => [
        {
          activityId: activity.id,
          athleteId: athlete!.id,
          dataType: 'score',
          value: 10 + index,
          unit: 'points',
          notes: 'Évaluation technique hebdomadaire',
        },
        {
          activityId: activity.id,
          athleteId: athlete!.id,
          dataType: 'distance',
          value: 1200 + index * 90,
          unit: 'meters',
          notes: 'Charge mesurée par GPS',
        },
      ]),
    });
  }

  console.log('✅ Seed terminé avec succès.');
  console.log('🔐 Mot de passe de tous les comptes DEMO:', DEMO_PASSWORD);
  console.log('📧 Admin de test:', users.admins[0].email);
}

main()
  .catch((error) => {
    console.error('❌ Erreur pendant le seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
