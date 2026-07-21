import {
  AuditAction,
  EventCategory,
  Gender,
  InstantDateActivity,
  InstantDateStatus,
  LikeType,
  MessageStatus,
  MessageType,
  NotificationChannel,
  NotificationType,
  ParticipantStatus,
  PhotoStatus,
  Prisma,
  PrismaClient,
  RelationshipGoal,
  VerificationStatus
} from "@prisma/client";
import type { Interest, User } from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

type SeedUserKey = "admin" | "arjun" | "aanya" | "meera" | "kabir" | "saira" | "rohan";

type SeedPhoto = {
  cloudinaryId: string;
  isPrimary?: boolean;
  url: string;
};

type SeedProfile = {
  age: number;
  bio: string;
  city: string;
  country: string;
  drinking: string;
  education: string;
  email: string;
  food: string[];
  gender: Gender;
  heightCm: number;
  interestedIn: Gender[];
  interests: string[];
  key: SeedUserKey;
  languages: string[];
  latitude: string;
  lifestyle: Prisma.InputJsonValue;
  longitude: string;
  music: string[];
  name: string;
  pets: string;
  photos: SeedPhoto[];
  profession: string;
  promptAnswers: Prisma.InputJsonValue;
  relationshipGoal: RelationshipGoal;
  religion?: string;
  role?: "ADMIN" | "USER";
  smoking: string;
  state: string;
  travel: string[];
  verificationStatus: VerificationStatus;
};

const seedUserPassword = process.env.SEED_USER_PASSWORD ?? "Matcha@2026";
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@2026";

const interests = [
  { category: "Culture", name: "Jaipur walks" },
  { category: "Food", name: "Masala chai" },
  { category: "Food", name: "Coffee dates" },
  { category: "Food", name: "Food festivals" },
  { category: "Music", name: "Bollywood" },
  { category: "Music", name: "Indie music" },
  { category: "Music", name: "Live concerts" },
  { category: "Lifestyle", name: "Dog person" },
  { category: "Lifestyle", name: "Fitness" },
  { category: "Lifestyle", name: "Slow travel" },
  { category: "Arts", name: "Art galleries" },
  { category: "Arts", name: "Poetry" },
  { category: "Social", name: "Book clubs" },
  { category: "Social", name: "Comedy nights" },
  { category: "Vibe", name: "Sarcastic" },
  { category: "Vibe", name: "Delulu but hopeful" },
  { category: "Vibe", name: "Old city sunsets" }
] as const;

const profiles: SeedProfile[] = [
  {
    age: 29,
    bio: "Building thoughtful dating experiences and reviewing safety cases with too much masala chai.",
    city: "Jaipur",
    country: "India",
    drinking: "Occasionally",
    education: "IIM Udaipur",
    email: "admin@matcha.local",
    food: ["Rajasthani thali", "Sushi", "Filter coffee"],
    gender: Gender.WOMAN,
    heightCm: 168,
    interestedIn: [Gender.MAN, Gender.WOMAN, Gender.NON_BINARY],
    interests: ["Jaipur walks", "Art galleries", "Book clubs", "Masala chai"],
    key: "admin",
    languages: ["English", "Hindi"],
    latitude: "26.912900",
    lifestyle: { mornings: "early", weekends: "museum walks", workout: "pilates" },
    longitude: "75.787300",
    music: ["indie", "hindustani classical", "bollywood"],
    name: "Naina Kapoor",
    pets: "Open to pets",
    photos: [
      {
        cloudinaryId: "seed/naina/primary",
        isPrimary: true,
        url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330"
      }
    ],
    profession: "Trust & Safety Lead",
    promptAnswers: {
      "A green flag I notice": "People who are kind to service staff.",
      "My Jaipur ritual": "An early walk near Albert Hall."
    },
    relationshipGoal: RelationshipGoal.FRIENDSHIP,
    role: "ADMIN",
    smoking: "Never",
    state: "Rajasthan",
    travel: ["Udaipur", "Goa", "Himachal"],
    verificationStatus: VerificationStatus.ID_VERIFIED
  },
  {
    age: 22,
    bio: "Good music, old city walks and random coffee dates.",
    city: "Jaipur",
    country: "India",
    drinking: "Socially",
    education: "Pearl Academy",
    email: "arjun@matcha.local",
    food: ["street food", "coffee", "laal maas"],
    gender: Gender.MAN,
    heightCm: 178,
    interestedIn: [Gender.WOMAN],
    interests: ["Coffee dates", "Jaipur walks", "Sarcastic", "Dog person", "Live concerts"],
    key: "arjun",
    languages: ["Hindi", "English"],
    latitude: "26.922070",
    lifestyle: { sleep: "late", workout: "football", weekends: "concerts" },
    longitude: "75.778885",
    music: ["indie", "bollywood", "pop"],
    name: "Arjun Rajput",
    pets: "Dog person",
    photos: [
      {
        cloudinaryId: "seed/arjun/primary",
        isPrimary: true,
        url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e"
      },
      {
        cloudinaryId: "seed/arjun/cafe",
        url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1"
      }
    ],
    profession: "Designer",
    promptAnswers: {
      "Dating me is like": "A playlist that somehow knows the weather.",
      "Sunday plan": "Coffee, a camera, and no fixed route."
    },
    relationshipGoal: RelationshipGoal.LONG_TERM,
    religion: "Hindu",
    smoking: "Never",
    state: "Rajasthan",
    travel: ["Pushkar", "Jodhpur", "Delhi"],
    verificationStatus: VerificationStatus.PHOTO_VERIFIED
  },
  {
    age: 24,
    bio: "Architect. Always looking up at jharokhas and down at dessert menus.",
    city: "Jaipur",
    country: "India",
    drinking: "Occasionally",
    education: "MNIT Jaipur",
    email: "aanya@matcha.local",
    food: ["ghewar", "thai curry", "croissants"],
    gender: Gender.WOMAN,
    heightCm: 164,
    interestedIn: [Gender.MAN],
    interests: ["Art galleries", "Old city sunsets", "Coffee dates", "Slow travel"],
    key: "aanya",
    languages: ["Hindi", "English", "Marwari"],
    latitude: "26.915450",
    lifestyle: { sleep: "early", workout: "yoga", weekends: "heritage walks" },
    longitude: "75.811020",
    music: ["indie", "lofi", "ghazals"],
    name: "Aanya Sharma",
    pets: "Cat person",
    photos: [
      {
        cloudinaryId: "seed/aanya/primary",
        isPrimary: true,
        url: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7"
      }
    ],
    profession: "Architect",
    promptAnswers: {
      "The way to my heart": "Notice tiny details.",
      "Best date spot": "Somewhere with arches and good coffee."
    },
    relationshipGoal: RelationshipGoal.LIFE_PARTNER,
    religion: "Hindu",
    smoking: "Never",
    state: "Rajasthan",
    travel: ["Kochi", "Udaipur", "Lisbon"],
    verificationStatus: VerificationStatus.PHOTO_VERIFIED
  },
  {
    age: 26,
    bio: "Product marketer, amateur poet, professional overthinker.",
    city: "Jaipur",
    country: "India",
    drinking: "Socially",
    education: "Delhi University",
    email: "meera@matcha.local",
    food: ["ramen", "chaat", "gelato"],
    gender: Gender.WOMAN,
    heightCm: 162,
    interestedIn: [Gender.MAN, Gender.NON_BINARY],
    interests: ["Poetry", "Book clubs", "Indie music", "Delulu but hopeful"],
    key: "meera",
    languages: ["English", "Hindi"],
    latitude: "26.897300",
    lifestyle: { sleep: "balanced", workout: "dance", weekends: "bookstores" },
    longitude: "75.802120",
    music: ["indie", "r&b", "bollywood"],
    name: "Meera Joshi",
    pets: "Wants a dog",
    photos: [
      {
        cloudinaryId: "seed/meera/primary",
        isPrimary: true,
        url: "https://images.unsplash.com/photo-1517841905240-472988babdf9"
      }
    ],
    profession: "Product Marketer",
    promptAnswers: {
      "I will fall for": "A good voice note.",
      "Two truths and a lie": "I write poems, I hate chai, I love airports."
    },
    relationshipGoal: RelationshipGoal.LONG_TERM,
    smoking: "Never",
    state: "Rajasthan",
    travel: ["Bangalore", "Shillong", "Paris"],
    verificationStatus: VerificationStatus.ID_VERIFIED
  },
  {
    age: 28,
    bio: "Chef. I remember people by what they order.",
    city: "Jaipur",
    country: "India",
    drinking: "Occasionally",
    education: "Culinary Academy of India",
    email: "kabir@matcha.local",
    food: ["everything spicy", "neapolitan pizza", "kulfi"],
    gender: Gender.MAN,
    heightCm: 181,
    interestedIn: [Gender.WOMAN],
    interests: ["Food festivals", "Comedy nights", "Fitness", "Masala chai"],
    key: "kabir",
    languages: ["Hindi", "English", "Punjabi"],
    latitude: "26.906450",
    lifestyle: { sleep: "late", workout: "weights", weekends: "new menus" },
    longitude: "75.748520",
    music: ["rock", "bollywood", "house"],
    name: "Kabir Singh",
    pets: "Dog person",
    photos: [
      {
        cloudinaryId: "seed/kabir/primary",
        isPrimary: true,
        url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d"
      }
    ],
    profession: "Chef",
    promptAnswers: {
      "Best skill": "Making breakfast look like a date.",
      "Unpopular opinion": "Dessert menus are personality tests."
    },
    relationshipGoal: RelationshipGoal.CASUAL,
    religion: "Sikh",
    smoking: "No",
    state: "Rajasthan",
    travel: ["Amritsar", "Bangkok", "Mumbai"],
    verificationStatus: VerificationStatus.PHOTO_VERIFIED
  },
  {
    age: 25,
    bio: "UX researcher collecting tiny stories from very big cities.",
    city: "Jaipur",
    country: "India",
    drinking: "No",
    education: "NID Ahmedabad",
    email: "saira@matcha.local",
    food: ["biryani", "falafel", "cold brew"],
    gender: Gender.WOMAN,
    heightCm: 166,
    interestedIn: [Gender.MAN, Gender.WOMAN],
    interests: ["Live concerts", "Slow travel", "Art galleries", "Book clubs"],
    key: "saira",
    languages: ["English", "Hindi", "Urdu"],
    latitude: "26.936880",
    lifestyle: { sleep: "early", workout: "walks", weekends: "field notes" },
    longitude: "75.806970",
    music: ["sufi", "indie", "jazz"],
    name: "Saira Khan",
    pets: "Open to pets",
    photos: [
      {
        cloudinaryId: "seed/saira/primary",
        isPrimary: true,
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
      }
    ],
    profession: "UX Researcher",
    promptAnswers: {
      "My simple joy": "A city waking up before traffic.",
      "First round is on me if": "You know a good live set."
    },
    relationshipGoal: RelationshipGoal.FIGURING_OUT,
    religion: "Muslim",
    smoking: "Never",
    state: "Rajasthan",
    travel: ["Lucknow", "Istanbul", "Kashmir"],
    verificationStatus: VerificationStatus.PHOTO_VERIFIED
  },
  {
    age: 27,
    bio: "Musician, teacher, and the person who will make a playlist before replying.",
    city: "Jaipur",
    country: "India",
    drinking: "Socially",
    education: "Rajasthan University",
    email: "rohan@matcha.local",
    food: ["pasta", "vada pav", "chai"],
    gender: Gender.MAN,
    heightCm: 176,
    interestedIn: [Gender.WOMAN],
    interests: ["Live concerts", "Bollywood", "Indie music", "Old city sunsets"],
    key: "rohan",
    languages: ["Hindi", "English"],
    latitude: "26.853510",
    lifestyle: { sleep: "late", workout: "cycling", weekends: "jam sessions" },
    longitude: "75.824140",
    music: ["bollywood", "indie", "rock"],
    name: "Rohan Mehta",
    pets: "Cat person",
    photos: [
      {
        cloudinaryId: "seed/rohan/primary",
        isPrimary: true,
        url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7"
      }
    ],
    profession: "Music Teacher",
    promptAnswers: {
      "My toxic trait": "I harmonize with doorbells.",
      "A date I would plan": "Live music, street food, long walk."
    },
    relationshipGoal: RelationshipGoal.LONG_TERM,
    religion: "Hindu",
    smoking: "Occasionally",
    state: "Rajasthan",
    travel: ["Pune", "Manali", "London"],
    verificationStatus: VerificationStatus.PHOTO_VERIFIED
  }
];

const seededConcertTitles = [
  "Arijit Singh - Live",
  "Diljit Dosanjh - Live",
  "Coldplay",
  "Prateek Kuhad - Live"
];

const seededEventTitles = [
  "Pink City Book Circle",
  "Nahargarh Sunset Walk",
  "C-Scheme Food Festival",
  "Saturday Comedy Baithak"
];

function futureDate(daysFromToday: number, hour: number, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function requireUser(users: Map<SeedUserKey, User>, key: SeedUserKey): User {
  const user = users.get(key);

  if (!user) {
    throw new Error(`Missing seeded user: ${key}`);
  }

  return user;
}

function requireInterest(interestsByName: Map<string, Interest>, name: string): Interest {
  const interest = interestsByName.get(name);

  if (!interest) {
    throw new Error(`Missing seeded interest: ${name}`);
  }

  return interest;
}

async function removeOwnedSeedData(): Promise<void> {
  const seedEmails = profiles.map((profile) => profile.email);
  const existingUsers = await prisma.user.findMany({
    select: { id: true },
    where: {
      email: {
        in: seedEmails
      }
    }
  });
  const userIds = existingUsers.map((user) => user.id);

  await prisma.event.deleteMany({
    where: {
      city: "Jaipur",
      title: {
        in: seededEventTitles
      }
    }
  });

  await prisma.concert.deleteMany({
    where: {
      title: {
        in: seededConcertTitles
      }
    }
  });

  if (userIds.length === 0) {
    return;
  }

  await prisma.notification.deleteMany({
    where: {
      userId: {
        in: userIds
      }
    }
  });
  await prisma.instantDate.deleteMany({
    where: {
      OR: [
        {
          requesterId: {
            in: userIds
          }
        },
        {
          recipientId: {
            in: userIds
          }
        }
      ]
    }
  });
  await prisma.match.deleteMany({
    where: {
      OR: [
        {
          userOneId: {
            in: userIds
          }
        },
        {
          userTwoId: {
            in: userIds
          }
        }
      ]
    }
  });
  await prisma.like.deleteMany({
    where: {
      OR: [
        {
          fromUserId: {
            in: userIds
          }
        },
        {
          toUserId: {
            in: userIds
          }
        }
      ]
    }
  });
  await prisma.pass.deleteMany({
    where: {
      OR: [
        {
          fromUserId: {
            in: userIds
          }
        },
        {
          toUserId: {
            in: userIds
          }
        }
      ]
    }
  });
  await prisma.photo.deleteMany({
    where: {
      userId: {
        in: userIds
      }
    }
  });
  await prisma.userInterest.deleteMany({
    where: {
      userId: {
        in: userIds
      }
    }
  });
  await prisma.settings.deleteMany({
    where: {
      userId: {
        in: userIds
      }
    }
  });
  await prisma.verification.deleteMany({
    where: {
      userId: {
        in: userIds
      }
    }
  });
  await prisma.auditLog.deleteMany({
    where: {
      actorId: {
        in: userIds
      }
    }
  });
}

async function seedInterests(): Promise<Map<string, Interest>> {
  const interestsByName = new Map<string, Interest>();

  for (const interest of interests) {
    const record = await prisma.interest.upsert({
      create: interest,
      update: {
        category: interest.category
      },
      where: {
        name: interest.name
      }
    });

    interestsByName.set(record.name, record);
  }

  return interestsByName;
}

async function seedUsers(interestsByName: Map<string, Interest>): Promise<Map<SeedUserKey, User>> {
  const users = new Map<SeedUserKey, User>();
  const userPasswordHash = await hash(seedUserPassword);
  const adminPasswordHash = await hash(seedAdminPassword);

  for (const profile of profiles) {
    const passwordHash = profile.role === "ADMIN" ? adminPasswordHash : userPasswordHash;
    const user = await prisma.user.upsert({
      create: {
        age: profile.age,
        bio: profile.bio,
        city: profile.city,
        country: profile.country,
        drinking: profile.drinking,
        education: profile.education,
        email: profile.email,
        emailVerifiedAt: new Date(),
        food: profile.food,
        gender: profile.gender,
        heightCm: profile.heightCm,
        interestedIn: profile.interestedIn,
        languages: profile.languages,
        latitude: new Prisma.Decimal(profile.latitude),
        lifestyle: profile.lifestyle,
        longitude: new Prisma.Decimal(profile.longitude),
        music: profile.music,
        name: profile.name,
        passwordHash,
        pets: profile.pets,
        profession: profile.profession,
        profileCompletion: profile.role === "ADMIN" ? 86 : 96,
        promptAnswers: profile.promptAnswers,
        relationshipGoal: profile.relationshipGoal,
        religion: profile.religion,
        role: profile.role ?? "USER",
        smoking: profile.smoking,
        state: profile.state,
        travel: profile.travel,
        verificationStatus: profile.verificationStatus
      },
      update: {
        age: profile.age,
        bio: profile.bio,
        city: profile.city,
        country: profile.country,
        deletedAt: null,
        drinking: profile.drinking,
        education: profile.education,
        emailVerifiedAt: new Date(),
        food: profile.food,
        gender: profile.gender,
        heightCm: profile.heightCm,
        interestedIn: profile.interestedIn,
        isBanned: false,
        languages: profile.languages,
        latitude: new Prisma.Decimal(profile.latitude),
        lifestyle: profile.lifestyle,
        longitude: new Prisma.Decimal(profile.longitude),
        music: profile.music,
        name: profile.name,
        passwordHash,
        pets: profile.pets,
        profession: profile.profession,
        profileCompletion: profile.role === "ADMIN" ? 86 : 96,
        promptAnswers: profile.promptAnswers,
        relationshipGoal: profile.relationshipGoal,
        religion: profile.religion,
        role: profile.role ?? "USER",
        smoking: profile.smoking,
        state: profile.state,
        travel: profile.travel,
        verificationStatus: profile.verificationStatus
      },
      where: {
        email: profile.email
      }
    });

    users.set(profile.key, user);

    await prisma.settings.upsert({
      create: {
        maxAge: 34,
        maxDistanceKm: 35,
        minAge: 21,
        userId: user.id
      },
      update: {
        discoverable: profile.role !== "ADMIN",
        emailNotifications: true,
        maxAge: 34,
        maxDistanceKm: 35,
        minAge: 21,
        pushNotifications: true,
        showDistance: true,
        showOnlineStatus: true
      },
      where: {
        userId: user.id
      }
    });

    await prisma.photo.createMany({
      data: profile.photos.map((photo, index) => ({
        cloudinaryId: photo.cloudinaryId,
        isPrimary: photo.isPrimary ?? index === 0,
        sortOrder: index,
        status: PhotoStatus.APPROVED,
        url: photo.url,
        userId: user.id
      }))
    });

    for (const interestName of profile.interests) {
      const interest = requireInterest(interestsByName, interestName);
      await prisma.userInterest.create({
        data: {
          interestId: interest.id,
          userId: user.id
        }
      });
    }

    const primaryPhoto = profile.photos.find((photo) => photo.isPrimary) ?? profile.photos[0];

    if (!primaryPhoto) {
      throw new Error(`Seed profile ${profile.email} requires at least one photo`);
    }

    await prisma.verification.create({
      data: {
        evidenceUrl: primaryPhoto.url,
        providerRef: `seed-${profile.key}`,
        reason: "Seeded verified profile for development and product demos.",
        reviewedAt: new Date(),
        reviewedBy: "seed-system",
        status: profile.verificationStatus,
        type:
          profile.verificationStatus === VerificationStatus.ID_VERIFIED
            ? "GOVERNMENT_ID"
            : "PHOTO_SELFIE",
        userId: user.id
      }
    });
  }

  return users;
}

async function seedConnections(users: Map<SeedUserKey, User>): Promise<void> {
  const arjun = requireUser(users, "arjun");
  const aanya = requireUser(users, "aanya");
  const meera = requireUser(users, "meera");
  const kabir = requireUser(users, "kabir");
  const saira = requireUser(users, "saira");
  const rohan = requireUser(users, "rohan");

  await prisma.like.createMany({
    data: [
      { fromUserId: arjun.id, toUserId: aanya.id, type: LikeType.SUPER_LIKE },
      { fromUserId: aanya.id, toUserId: arjun.id, type: LikeType.LIKE },
      { fromUserId: meera.id, toUserId: rohan.id, type: LikeType.LIKE },
      { fromUserId: rohan.id, toUserId: meera.id, type: LikeType.LIKE },
      { fromUserId: kabir.id, toUserId: saira.id, type: LikeType.LIKE },
      { fromUserId: saira.id, toUserId: kabir.id, type: LikeType.LIKE }
    ]
  });

  const arjunAanya = await prisma.match.create({
    data: {
      compatibilityScore: 92,
      userOneId: arjun.id,
      userTwoId: aanya.id
    }
  });
  const meeraRohan = await prisma.match.create({
    data: {
      compatibilityScore: 87,
      userOneId: meera.id,
      userTwoId: rohan.id
    }
  });
  const kabirSaira = await prisma.match.create({
    data: {
      compatibilityScore: 81,
      userOneId: kabir.id,
      userTwoId: saira.id
    }
  });

  await prisma.message.createMany({
    data: [
      {
        body: "Old city coffee walk this weekend?",
        matchId: arjunAanya.id,
        senderId: arjun.id,
        status: MessageStatus.READ,
        type: MessageType.TEXT
      },
      {
        body: "Only if you promise one architectural fun fact.",
        matchId: arjunAanya.id,
        senderId: aanya.id,
        status: MessageStatus.READ,
        type: MessageType.TEXT
      },
      {
        body: "I have three. Choose wisely.",
        matchId: arjunAanya.id,
        senderId: arjun.id,
        status: MessageStatus.DELIVERED,
        type: MessageType.TEXT
      },
      {
        body: "Prateek Kuhad tickets are basically a personality test.",
        matchId: meeraRohan.id,
        senderId: meera.id,
        status: MessageStatus.READ,
        type: MessageType.TEXT
      },
      {
        body: "Then I am studying hard.",
        matchId: meeraRohan.id,
        senderId: rohan.id,
        status: MessageStatus.DELIVERED,
        type: MessageType.TEXT
      },
      {
        body: "I know a food festival where research notes are welcome.",
        matchId: kabirSaira.id,
        senderId: kabir.id,
        status: MessageStatus.SENT,
        type: MessageType.TEXT
      }
    ]
  });
}

async function seedExperiences(users: Map<SeedUserKey, User>): Promise<void> {
  const arjun = requireUser(users, "arjun");
  const aanya = requireUser(users, "aanya");
  const meera = requireUser(users, "meera");
  const kabir = requireUser(users, "kabir");
  const saira = requireUser(users, "saira");
  const rohan = requireUser(users, "rohan");

  const arijit = await prisma.concert.create({
    data: {
      artist: "Arijit Singh",
      city: "Jaipur",
      coverImage: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
      genreTags: ["indie", "bollywood", "romantic"],
      isPublished: true,
      startsAt: futureDate(14, 19),
      title: "Arijit Singh - Live",
      venue: "JECC, Jaipur"
    }
  });
  const diljit = await prisma.concert.create({
    data: {
      artist: "Diljit Dosanjh",
      city: "Jaipur",
      coverImage: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14",
      genreTags: ["punjabi", "pop", "bollywood"],
      isPublished: true,
      startsAt: futureDate(21, 20),
      title: "Diljit Dosanjh - Live",
      venue: "JECC, Jaipur"
    }
  });
  const coldplay = await prisma.concert.create({
    data: {
      artist: "Coldplay",
      city: "Mumbai",
      coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
      genreTags: ["pop", "rock"],
      isPublished: true,
      startsAt: futureDate(35, 18),
      title: "Coldplay",
      venue: "DY Patil Stadium, Mumbai"
    }
  });
  const prateek = await prisma.concert.create({
    data: {
      artist: "Prateek Kuhad",
      city: "Jaipur",
      coverImage: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea",
      genreTags: ["indie", "acoustic"],
      isPublished: true,
      startsAt: futureDate(42, 18),
      title: "Prateek Kuhad - Live",
      venue: "Clarks Amer, Jaipur"
    }
  });

  await prisma.concertParticipant.createMany({
    data: [
      {
        concertId: arijit.id,
        intent: "concert_buddy",
        status: ParticipantStatus.JOINED,
        userId: arjun.id
      },
      {
        concertId: arijit.id,
        intent: "maybe_more",
        status: ParticipantStatus.INTERESTED,
        userId: aanya.id
      },
      {
        concertId: arijit.id,
        intent: "new_friends",
        status: ParticipantStatus.INTERESTED,
        userId: saira.id
      },
      {
        concertId: diljit.id,
        intent: "group_vibe",
        status: ParticipantStatus.INTERESTED,
        userId: kabir.id
      },
      {
        concertId: coldplay.id,
        intent: "concert_buddy",
        status: ParticipantStatus.INTERESTED,
        userId: rohan.id
      },
      {
        concertId: prateek.id,
        intent: "maybe_more",
        status: ParticipantStatus.JOINED,
        userId: meera.id
      },
      {
        concertId: prateek.id,
        intent: "concert_buddy",
        status: ParticipantStatus.INTERESTED,
        userId: rohan.id
      }
    ]
  });

  const bookClub = await prisma.event.create({
    data: {
      category: EventCategory.BOOK_CLUB,
      city: "Jaipur",
      coverImage: "https://images.unsplash.com/photo-1519682337058-a94d519337bc",
      description: "A quiet evening discussing modern Indian romance and friendship.",
      endsAt: futureDate(9, 20, 30),
      isPublished: true,
      startsAt: futureDate(9, 18, 30),
      title: "Pink City Book Circle",
      venue: "Kunzum Books, C-Scheme"
    }
  });
  const heritageWalk = await prisma.event.create({
    data: {
      category: EventCategory.COMMUNITY,
      city: "Jaipur",
      coverImage: "https://images.unsplash.com/photo-1599661046827-dacde6976549",
      description: "Slow golden-hour walk with safe group meetup hosts.",
      endsAt: futureDate(6, 19),
      isPublished: true,
      startsAt: futureDate(6, 17),
      title: "Nahargarh Sunset Walk",
      venue: "Nahargarh Fort"
    }
  });
  const foodFestival = await prisma.event.create({
    data: {
      category: EventCategory.FOOD_FESTIVAL,
      city: "Jaipur",
      coverImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
      description: "Curated food stalls, live music and a group-first meetup format.",
      endsAt: futureDate(18, 23),
      isPublished: true,
      startsAt: futureDate(18, 17),
      title: "C-Scheme Food Festival",
      venue: "C-Scheme Social Lawns"
    }
  });
  const comedyNight = await prisma.event.create({
    data: {
      category: EventCategory.COMEDY,
      city: "Jaipur",
      coverImage: "https://images.unsplash.com/photo-1527224857830-43a7acc85260",
      description: "Low-pressure laughs for first conversations.",
      endsAt: futureDate(12, 21, 30),
      isPublished: true,
      startsAt: futureDate(12, 19, 30),
      title: "Saturday Comedy Baithak",
      venue: "Jawahar Kala Kendra"
    }
  });

  await prisma.eventParticipant.createMany({
    data: [
      { eventId: bookClub.id, status: ParticipantStatus.JOINED, userId: meera.id },
      { eventId: bookClub.id, status: ParticipantStatus.INTERESTED, userId: saira.id },
      { eventId: heritageWalk.id, status: ParticipantStatus.JOINED, userId: arjun.id },
      { eventId: heritageWalk.id, status: ParticipantStatus.JOINED, userId: aanya.id },
      { eventId: foodFestival.id, status: ParticipantStatus.JOINED, userId: kabir.id },
      { eventId: foodFestival.id, status: ParticipantStatus.INTERESTED, userId: saira.id },
      { eventId: comedyNight.id, status: ParticipantStatus.INTERESTED, userId: rohan.id },
      { eventId: comedyNight.id, status: ParticipantStatus.INTERESTED, userId: kabir.id }
    ]
  });

  await prisma.instantDate.createMany({
    data: [
      {
        activity: InstantDateActivity.COFFEE,
        latitude: new Prisma.Decimal("26.912480"),
        longitude: new Prisma.Decimal("75.787270"),
        proposedAt: futureDate(1, 18),
        recipientId: aanya.id,
        requesterId: arjun.id,
        status: InstantDateStatus.ACCEPTED,
        timeWindow: "tonight",
        venue: "Half Light Coffee Roasters"
      },
      {
        activity: InstantDateActivity.ART,
        latitude: new Prisma.Decimal("26.884820"),
        longitude: new Prisma.Decimal("75.812950"),
        proposedAt: futureDate(3, 17),
        recipientId: rohan.id,
        requesterId: meera.id,
        status: InstantDateStatus.PENDING,
        timeWindow: "this weekend",
        venue: "Jawahar Kala Kendra"
      },
      {
        activity: InstantDateActivity.MARKET,
        latitude: new Prisma.Decimal("26.923940"),
        longitude: new Prisma.Decimal("75.826740"),
        proposedAt: futureDate(2, 16),
        recipientId: null,
        requesterId: saira.id,
        status: InstantDateStatus.PENDING,
        timeWindow: "custom",
        venue: "Bapu Bazaar"
      }
    ]
  });
}

async function seedNotifications(users: Map<SeedUserKey, User>): Promise<void> {
  const arjun = requireUser(users, "arjun");
  const aanya = requireUser(users, "aanya");
  const meera = requireUser(users, "meera");
  const rohan = requireUser(users, "rohan");

  await prisma.notification.createMany({
    data: [
      {
        body: "Aanya matched your old-city coffee energy.",
        channel: NotificationChannel.IN_APP,
        data: { source: "seed", userId: aanya.id },
        sentAt: new Date(),
        title: "New match",
        type: NotificationType.MATCH,
        userId: arjun.id
      },
      {
        body: "Arjun accepted your concert buddy vibe.",
        channel: NotificationChannel.IN_APP,
        data: { source: "seed", userId: arjun.id },
        sentAt: new Date(),
        title: "Concert mode update",
        type: NotificationType.CONCERT_INVITATION,
        userId: aanya.id
      },
      {
        body: "Rohan replied to your Prateek Kuhad message.",
        channel: NotificationChannel.PUSH,
        data: { source: "seed", userId: rohan.id },
        sentAt: new Date(),
        title: "New message",
        type: NotificationType.MESSAGE,
        userId: meera.id
      },
      {
        body: "Your profile quality score is in the top 12% this week.",
        channel: NotificationChannel.EMAIL,
        data: { source: "seed" },
        sentAt: new Date(),
        title: "Aura weekly recap",
        type: NotificationType.SYSTEM,
        userId: rohan.id
      }
    ]
  });
}

async function seedAuditLogs(users: Map<SeedUserKey, User>): Promise<void> {
  await prisma.auditLog.createMany({
    data: [...users.values()].map((user) => ({
      action: user.role === "ADMIN" ? AuditAction.ADMIN_ACTION : AuditAction.USER_CREATED,
      actorId: user.id,
      entity: "User",
      entityId: user.id,
      metadata: {
        seed: true
      },
      userAgent: "matcha-seed"
    }))
  });
}

async function main(): Promise<void> {
  await removeOwnedSeedData();

  const interestsByName = await seedInterests();
  const users = await seedUsers(interestsByName);

  await seedConnections(users);
  await seedExperiences(users);
  await seedNotifications(users);
  await seedAuditLogs(users);

  const [userCount, interestCount, matchCount, concertCount, eventCount] = await Promise.all([
    prisma.user.count(),
    prisma.interest.count(),
    prisma.match.count(),
    prisma.concert.count(),
    prisma.event.count()
  ]);

  console.info(
    JSON.stringify(
      {
        credentials: {
          adminEmail: "admin@matcha.local",
          adminPassword: seedAdminPassword,
          userPassword: seedUserPassword
        },
        database: {
          concerts: concertCount,
          events: eventCount,
          interests: interestCount,
          matches: matchCount,
          users: userCount
        },
        status: "seeded"
      },
      null,
      2
    )
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
