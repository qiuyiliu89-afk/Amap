const MIN_VIDEO_DURATION_SECONDS = 15;
const MAX_VIDEO_DURATION_SECONDS = 180;
export const DEFAULT_PROMO_VIDEO_DURATION_SECONDS = 60;

function clampDuration(seconds: number) {
  return Math.min(MAX_VIDEO_DURATION_SECONDS, Math.max(MIN_VIDEO_DURATION_SECONDS, Math.round(seconds)));
}

export function inferVideoDurationSeconds(
  requirement: string,
  fallback = DEFAULT_PROMO_VIDEO_DURATION_SECONDS,
) {
  const text = requirement.trim();
  const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:分钟|min(?:ute)?s?)/i);
  if (minuteMatch) return clampDuration(Number(minuteMatch[1]) * 60);

  const secondMatch = text.match(/(\d+)\s*(?:秒|s(?:ec(?:ond)?s?)?)(?![a-z])/i);
  if (secondMatch) return clampDuration(Number(secondMatch[1]));

  return clampDuration(fallback);
}

export function formatVideoDuration(seconds: number) {
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60}min`;
  return `${seconds}s`;
}

export function createVideoTimeRanges(durationSeconds: number, segmentCount: number) {
  const duration = clampDuration(durationSeconds);
  const count = Math.max(1, Math.min(10, Math.round(segmentCount)));

  return Array.from({ length: count }, (_, index) => {
    const start = Math.round((duration * index) / count);
    const end = index === count - 1 ? duration : Math.round((duration * (index + 1)) / count);
    return `${start}-${end}s`;
  });
}
