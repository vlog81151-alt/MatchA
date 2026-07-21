import { Gender, LikeType, RelationshipGoal } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { loginSchema, signupSchema } from "../src/auth/auth.schemas.js";
import {
  likeActionSchema,
  matchingFiltersSchema,
  recommendationQuerySchema
} from "../src/matching/matching.schemas.js";
import {
  pushTokenRegisterSchema,
  pushTokenRevokeSchema
} from "../src/notification/notification.schemas.js";
import {
  photoCreateSchema,
  photoUploadSignatureSchema,
  profileUpdateSchema,
  verificationRequestSchema
} from "../src/profile/profile.schemas.js";

describe("auth schemas", () => {
  it("normalizes login email and applies remember-me default", () => {
    const result = loginSchema.parse({
      email: " AANYA@MATCHA.LOCAL ",
      password: "Matcha@2026"
    });

    expect(result).toEqual({
      email: "aanya@matcha.local",
      password: "Matcha@2026",
      rememberMe: false
    });
  });

  it("rejects weak signup passwords", () => {
    expect(() =>
      signupSchema.parse({
        email: "new@matcha.local",
        name: "New User",
        password: "password"
      })
    ).toThrow(/uppercase|number/i);
  });
});

describe("matching schemas", () => {
  it("coerces recommendation query filters", () => {
    const result = recommendationQuerySchema.parse({
      ageMax: "32",
      ageMin: "22",
      gender: Gender.MAN,
      limit: "12",
      maxDistanceKm: "35",
      relationshipGoal: RelationshipGoal.LONG_TERM
    });

    expect(result).toEqual({
      ageMax: 32,
      ageMin: 22,
      gender: Gender.MAN,
      limit: 12,
      maxDistanceKm: 35,
      relationshipGoal: RelationshipGoal.LONG_TERM
    });
  });

  it("rejects impossible age ranges and unknown query fields", () => {
    expect(() =>
      recommendationQuerySchema.parse({
        ageMax: 24,
        ageMin: 30
      })
    ).toThrow(/ageMin/i);

    expect(() =>
      recommendationQuerySchema.parse({
        limit: 10,
        unsafe: "value"
      })
    ).toThrow(/unrecognized/i);
  });

  it("defaults like actions and validates matching filters", () => {
    expect(
      likeActionSchema.parse({
        targetUserId: "user_123"
      })
    ).toEqual({
      targetUserId: "user_123",
      type: LikeType.LIKE
    });

    expect(() =>
      matchingFiltersSchema.parse({
        maxAge: 22,
        minAge: 40
      })
    ).toThrow(/minAge/i);
  });
});

describe("profile schemas", () => {
  it("trims nullable optional profile strings and bounds location", () => {
    const result = profileUpdateSchema.parse({
      bio: "  Good music and old city walks.  ",
      city: null,
      gender: Gender.WOMAN,
      interestedIn: [Gender.MAN],
      latitude: "26.9124",
      longitude: "75.7873"
    });

    expect(result).toEqual({
      bio: "Good music and old city walks.",
      city: undefined,
      gender: Gender.WOMAN,
      interestedIn: [Gender.MAN],
      latitude: 26.9124,
      longitude: 75.7873
    });

    expect(() =>
      profileUpdateSchema.parse({
        latitude: 120
      })
    ).toThrow();
  });

  it("validates photo and verification URLs", () => {
    expect(
      photoCreateSchema.parse({
        isPrimary: true,
        url: "https://images.example.com/profile.jpg"
      })
    ).toMatchObject({
      isPrimary: true,
      url: "https://images.example.com/profile.jpg"
    });

    expect(() =>
      verificationRequestSchema.parse({
        evidenceUrl: "not-a-url",
        type: "PHOTO_SELFIE"
      })
    ).toThrow();
  });

  it("defaults profile photo upload signatures to profile-photo purpose", () => {
    expect(photoUploadSignatureSchema.parse({})).toEqual({
      purpose: "PROFILE_PHOTO"
    });

    expect(
      photoUploadSignatureSchema.parse({
        purpose: "VERIFICATION_EVIDENCE"
      })
    ).toEqual({
      purpose: "VERIFICATION_EVIDENCE"
    });
  });
});

describe("notification schemas", () => {
  it("validates push token registration and revoke payloads", () => {
    const token = "fcm-token-for-browser-device-1234567890";

    expect(
      pushTokenRegisterSchema.parse({
        token,
        userAgent: "MatchA Web"
      })
    ).toEqual({
      platform: "WEB",
      token,
      userAgent: "MatchA Web"
    });

    expect(
      pushTokenRevokeSchema.parse({
        token
      })
    ).toEqual({
      token
    });

    expect(() =>
      pushTokenRegisterSchema.parse({
        token: "too-short"
      })
    ).toThrow();
  });
});
