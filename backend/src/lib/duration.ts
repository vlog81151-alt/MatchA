const durationPattern = /^(\d+)([smhd])$/;

export function durationToMilliseconds(duration: string): number {
  const match = durationPattern.exec(duration.trim());

  if (!match) {
    throw new Error(`Invalid duration: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid duration unit: ${unit}`);
  }
}

export function addDuration(date: Date, duration: string): Date {
  return new Date(date.getTime() + durationToMilliseconds(duration));
}
