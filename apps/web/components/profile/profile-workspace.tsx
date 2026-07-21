"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  CheckCircle2,
  Loader2,
  LogOut,
  ShieldCheck,
  Trash2,
  UserRoundCheck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge, Button, FloralFrame, Input, Logo, Textarea } from "@matcha/ui";

import { FormMessage } from "@/components/auth/form-message";
import { logout } from "@/lib/auth-client";
import {
  addProfilePhoto,
  deleteProfilePhoto,
  getProfile,
  requestVerification,
  setPrimaryPhoto,
  updateProfile,
  type MatchaProfile
} from "@/lib/profile-client";
import {
  joinList,
  parseList,
  photoFormSchema,
  profileFormSchema,
  type PhotoFormValues,
  type ProfileFormValues
} from "@/lib/profile-form";
import { useAuthStore } from "@/store/auth-store";

const genderOptions = [
  ["WOMAN", "Woman"],
  ["MAN", "Man"],
  ["NON_BINARY", "Non-binary"],
  ["SELF_DESCRIBE", "Self describe"]
] as const;

const relationshipGoalOptions = [
  ["LONG_TERM", "Long term"],
  ["LIFE_PARTNER", "Life partner"],
  ["CASUAL", "Casual"],
  ["FRIENDSHIP", "Friendship"],
  ["FIGURING_OUT", "Figuring out"]
] as const;

function textOrUndefined(value?: string): string | undefined {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function recordValue(value: unknown, key: string): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const output = (value as Record<string, unknown>)[key];

  return typeof output === "string" ? output : "";
}

function profileDefaults(profile?: MatchaProfile): ProfileFormValues {
  return {
    age: profile?.age ?? 22,
    bio: profile?.bio ?? "",
    city: profile?.city ?? "Jaipur",
    country: profile?.country ?? "India",
    drinking: profile?.drinking ?? "",
    education: profile?.education ?? "",
    foodText: joinList(profile?.food ?? []),
    gender: (profile?.gender as ProfileFormValues["gender"]) ?? "MAN",
    heightCm: profile?.heightCm ?? 170,
    interestedIn: (profile?.interestedIn as ProfileFormValues["interestedIn"]) ?? ["WOMAN"],
    interestsText: joinList(profile?.interests.map((interest) => interest.name) ?? []),
    languagesText: joinList(profile?.languages ?? ["Hindi", "English"]),
    latitude: Number(profile?.latitude ?? 26.9124),
    longitude: Number(profile?.longitude ?? 75.7873),
    musicText: joinList(profile?.music ?? []),
    name: profile?.name ?? "",
    pets: profile?.pets ?? "",
    profession: profile?.profession ?? "",
    promptOne: recordValue(profile?.promptAnswers, "The way to my heart"),
    promptTwo: recordValue(profile?.promptAnswers, "A date I would plan"),
    relationshipGoal:
      (profile?.relationshipGoal as ProfileFormValues["relationshipGoal"]) ?? "LONG_TERM",
    religion: profile?.religion ?? "",
    smoking: profile?.smoking ?? "",
    state: profile?.state ?? "Rajasthan",
    travelText: joinList(profile?.travel ?? []),
    weekendStyle: recordValue(profile?.lifestyle, "weekends"),
    workStyle: recordValue(profile?.lifestyle, "workStyle")
  };
}

export function ProfileWorkspace({ mode }: { mode: "onboarding" | "profile" }): React.JSX.Element {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [profile, setProfile] = useState<MatchaProfile>();
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [photoError, setPhotoError] = useState<string>();
  const [verificationError, setVerificationError] = useState<string>();
  const profileForm = useForm<ProfileFormValues>({
    defaultValues: profileDefaults(),
    resolver: zodResolver(profileFormSchema)
  });
  const photoForm = useForm<PhotoFormValues>({
    defaultValues: {
      isPrimary: false,
      url: ""
    },
    resolver: zodResolver(photoFormSchema)
  });

  useEffect(() => {
    let active = true;

    void getProfile()
      .then((loadedProfile) => {
        if (!active) {
          return;
        }

        setProfile(loadedProfile);
        profileForm.reset(profileDefaults(loadedProfile));
      })
      .catch(() => {
        router.push("/login");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [profileForm, router]);

  const completion = profile?.profileCompletion ?? 0;
  const primaryPhoto = useMemo(
    () => profile?.photos.find((photo) => photo.isPrimary) ?? profile?.photos[0],
    [profile?.photos]
  );

  async function onProfileSubmit(values: ProfileFormValues): Promise<void> {
    setFormError(undefined);
    setSuccess(undefined);

    try {
      const updatedProfile = await updateProfile({
        age: values.age,
        bio: values.bio,
        city: values.city,
        country: values.country,
        drinking: textOrUndefined(values.drinking),
        education: values.education,
        food: parseList(values.foodText),
        gender: values.gender,
        heightCm: values.heightCm,
        interestedIn: values.interestedIn,
        interests: parseList(values.interestsText),
        languages: parseList(values.languagesText),
        latitude: values.latitude,
        lifestyle: {
          weekends: values.weekendStyle ?? "",
          workStyle: values.workStyle ?? ""
        },
        longitude: values.longitude,
        music: parseList(values.musicText),
        name: values.name,
        pets: textOrUndefined(values.pets),
        profession: values.profession,
        promptAnswers: {
          "A date I would plan": values.promptTwo,
          "The way to my heart": values.promptOne
        },
        relationshipGoal: values.relationshipGoal,
        religion: textOrUndefined(values.religion),
        smoking: textOrUndefined(values.smoking),
        state: values.state,
        travel: parseList(values.travelText)
      });

      setProfile(updatedProfile);
      setSuccess(
        mode === "onboarding" ? "Profile saved. MatchA can now tune your vibe." : "Profile updated."
      );
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Profile update failed");
    }
  }

  async function onPhotoSubmit(values: PhotoFormValues): Promise<void> {
    setPhotoError(undefined);

    try {
      const updatedProfile = await addProfilePhoto(values);
      setProfile(updatedProfile);
      photoForm.reset({
        isPrimary: false,
        url: ""
      });
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Photo could not be saved");
    }
  }

  async function onRequestVerification(): Promise<void> {
    setVerificationError(undefined);

    if (!primaryPhoto) {
      setVerificationError("Add a profile photo before requesting verification.");
      return;
    }

    try {
      setProfile(
        await requestVerification({
          evidenceUrl: primaryPhoto.url,
          type: "PHOTO_SELFIE"
        })
      );
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : "Verification request failed");
    }
  }

  async function onLogout(): Promise<void> {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await logout();
    } finally {
      setUser(null);
      router.replace("/login");
      router.refresh();
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white/70 px-5 py-4 text-sm text-royal-ink shadow-glass">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading profile
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/home" aria-label="MatchA app home">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <Badge>{profile?.verificationStatus?.replaceAll("_", " ").toLowerCase()}</Badge>
          <Button asChild size="sm" variant="secondary">
            <Link href="/home">Home</Link>
          </Button>
          <Button
            aria-label="Logout"
            disabled={loggingOut}
            onClick={() => void onLogout()}
            size="sm"
            type="button"
            variant="ghost"
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Logout
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[0.74fr_1.26fr] lg:px-8">
        <aside className="space-y-5">
          <FloralFrame className="p-4">
            <div className="overflow-hidden rounded-[1.4rem] border border-rose-100 bg-white/70">
              {primaryPhoto ? (
                <img
                  alt={profile?.name ?? "MatchA profile"}
                  className="h-80 w-full object-cover"
                  src={primaryPhoto.url}
                />
              ) : (
                <div className="grid h-80 place-items-center bg-rose-50 text-rose-700">
                  <Camera className="h-10 w-10" />
                </div>
              )}
              <div className="p-5">
                <p className="font-display text-3xl text-royal-ink">
                  {profile?.name ?? "Your profile"}
                  {profile?.age ? `, ${profile.age}` : ""}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  {[profile?.profession, profile?.city].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    <span>Completion</span>
                    <span>{completion}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-rose-100">
                    <div
                      className="h-full rounded-full bg-rose-gold"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </FloralFrame>

          <section className="rounded-2xl border border-rose-100 bg-white/70 p-5 shadow-glass">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-rose-700" />
              <h2 className="font-display text-2xl text-royal-ink">Photos</h2>
            </div>
            <form
              className="mt-4 grid gap-3"
              onSubmit={(event) => void photoForm.handleSubmit(onPhotoSubmit)(event)}
            >
              <Input placeholder="https://..." {...photoForm.register("url")} />
              <label className="flex items-center gap-2 text-sm text-zinc-600">
                <input
                  className="h-4 w-4 rounded border-rose-200"
                  type="checkbox"
                  {...photoForm.register("isPrimary")}
                />
                Make primary
              </label>
              {photoForm.formState.errors.url ? (
                <p className="text-xs text-rose-700">{photoForm.formState.errors.url.message}</p>
              ) : null}
              <FormMessage error={photoError} />
              <Button disabled={photoForm.formState.isSubmitting} type="submit" variant="secondary">
                Add photo
              </Button>
            </form>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {profile?.photos.map((photo) => (
                <div
                  className="group relative overflow-hidden rounded-xl border border-rose-100"
                  key={photo.id}
                >
                  <img alt="" className="h-24 w-full object-cover" src={photo.url} />
                  <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
                    <button
                      className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-rose-700"
                      onClick={() => void setPrimaryPhoto(photo.id).then(setProfile)}
                      type="button"
                      aria-label="Set primary photo"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <button
                      className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-rose-700"
                      onClick={() => void deleteProfilePhoto(photo.id).then(setProfile)}
                      type="button"
                      aria-label="Delete photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-rose-100 bg-white/70 p-5 shadow-glass">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-rose-700" />
              <h2 className="font-display text-2xl text-royal-ink">Verification</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Current status: {profile?.verificationStatus?.replaceAll("_", " ").toLowerCase()}
            </p>
            <FormMessage error={verificationError} />
            <Button
              className="mt-4 w-full"
              type="button"
              variant="royal"
              onClick={() => void onRequestVerification()}
            >
              <UserRoundCheck className="h-4 w-4" />
              Request review
            </Button>
          </section>
        </aside>

        <section className="rounded-2xl border border-rose-100 bg-white/70 p-4 shadow-glass sm:p-6">
          <div className="flex flex-col gap-2 border-b border-rose-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge>{mode === "onboarding" ? "Onboarding" : "Profile"}</Badge>
              <h1 className="mt-3 font-display text-4xl text-royal-ink sm:text-5xl">
                {mode === "onboarding" ? "Complete your MatchA profile" : "Edit your profile"}
              </h1>
            </div>
            <p className="text-sm text-zinc-600">{profile?.email}</p>
          </div>

          <form
            className="mt-6 grid gap-8"
            onSubmit={(event) => void profileForm.handleSubmit(onProfileSubmit)(event)}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name" error={profileForm.formState.errors.name?.message}>
                <Input {...profileForm.register("name")} />
              </Field>
              <Field label="Age" error={profileForm.formState.errors.age?.message}>
                <Input type="number" {...profileForm.register("age")} />
              </Field>
              <Field label="Gender" error={profileForm.formState.errors.gender?.message}>
                <Select {...profileForm.register("gender")}>
                  {genderOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Relationship goal"
                error={profileForm.formState.errors.relationshipGoal?.message}
              >
                <Select {...profileForm.register("relationshipGoal")}>
                  {relationshipGoalOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Profession" error={profileForm.formState.errors.profession?.message}>
                <Input {...profileForm.register("profession")} />
              </Field>
              <Field label="Education" error={profileForm.formState.errors.education?.message}>
                <Input {...profileForm.register("education")} />
              </Field>
              <Field label="Height cm" error={profileForm.formState.errors.heightCm?.message}>
                <Input type="number" {...profileForm.register("heightCm")} />
              </Field>
              <Field label="Religion" error={profileForm.formState.errors.religion?.message}>
                <Input {...profileForm.register("religion")} />
              </Field>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-royal-ink">Interested in</legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {genderOptions.map(([value, label]) => (
                  <label
                    className="flex items-center gap-2 rounded-xl border border-rose-100 bg-white/70 px-3 py-2 text-sm text-zinc-700"
                    key={value}
                  >
                    <input
                      className="h-4 w-4 rounded border-rose-200"
                      type="checkbox"
                      value={value}
                      {...profileForm.register("interestedIn")}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <Field label="Bio" error={profileForm.formState.errors.bio?.message}>
              <Textarea {...profileForm.register("bio")} />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Languages" error={profileForm.formState.errors.languagesText?.message}>
                <Input {...profileForm.register("languagesText")} />
              </Field>
              <Field
                label="Interests and hobbies"
                error={profileForm.formState.errors.interestsText?.message}
              >
                <Input {...profileForm.register("interestsText")} />
              </Field>
              <Field label="Music" error={profileForm.formState.errors.musicText?.message}>
                <Input {...profileForm.register("musicText")} />
              </Field>
              <Field label="Food" error={profileForm.formState.errors.foodText?.message}>
                <Input {...profileForm.register("foodText")} />
              </Field>
              <Field label="Travel" error={profileForm.formState.errors.travelText?.message}>
                <Input {...profileForm.register("travelText")} />
              </Field>
              <Field label="Pets" error={profileForm.formState.errors.pets?.message}>
                <Input {...profileForm.register("pets")} />
              </Field>
              <Field label="Smoking" error={profileForm.formState.errors.smoking?.message}>
                <Input {...profileForm.register("smoking")} />
              </Field>
              <Field label="Drinking" error={profileForm.formState.errors.drinking?.message}>
                <Input {...profileForm.register("drinking")} />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="The way to my heart"
                error={profileForm.formState.errors.promptOne?.message}
              >
                <Textarea {...profileForm.register("promptOne")} />
              </Field>
              <Field
                label="A date I would plan"
                error={profileForm.formState.errors.promptTwo?.message}
              >
                <Textarea {...profileForm.register("promptTwo")} />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="City" error={profileForm.formState.errors.city?.message}>
                <Input {...profileForm.register("city")} />
              </Field>
              <Field label="State" error={profileForm.formState.errors.state?.message}>
                <Input {...profileForm.register("state")} />
              </Field>
              <Field label="Country" error={profileForm.formState.errors.country?.message}>
                <Input {...profileForm.register("country")} />
              </Field>
              <Field label="Latitude" error={profileForm.formState.errors.latitude?.message}>
                <Input step="any" type="number" {...profileForm.register("latitude")} />
              </Field>
              <Field label="Longitude" error={profileForm.formState.errors.longitude?.message}>
                <Input step="any" type="number" {...profileForm.register("longitude")} />
              </Field>
              <Field
                label="Weekend style"
                error={profileForm.formState.errors.weekendStyle?.message}
              >
                <Input {...profileForm.register("weekendStyle")} />
              </Field>
              <Field label="Work style" error={profileForm.formState.errors.workStyle?.message}>
                <Input {...profileForm.register("workStyle")} />
              </Field>
            </div>

            <FormMessage error={formError} success={success} />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button disabled={profileForm.formState.isSubmitting} type="submit">
                {profileForm.formState.isSubmitting ? "Saving..." : "Save profile"}
              </Button>
              <Button asChild variant="secondary">
                <Link href="/home">View home</Link>
              </Button>
              <Button
                disabled={loggingOut}
                onClick={() => void onLogout()}
                type="button"
                variant="ghost"
              >
                {loggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Logout
              </Button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}

function Field({
  children,
  error,
  label
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}): React.JSX.Element {
  return (
    <label className="grid gap-2 text-sm font-semibold text-royal-ink">
      {label}
      {children}
      {error ? <span className="text-xs font-normal text-rose-700">{error}</span> : null}
    </label>
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>): React.JSX.Element {
  return (
    <select
      className="h-11 w-full rounded-xl border border-rose-100 bg-white/80 px-4 text-sm text-royal-ink outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
      {...props}
    />
  );
}
