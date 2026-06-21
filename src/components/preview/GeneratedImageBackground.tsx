import { useEffect, useState } from "react";

export function GeneratedImageBackground({
  imageUrl,
  className = "",
}: {
  imageUrl?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  if (!imageUrl || failed) return null;

  return (
    <img
      src={imageUrl}
      alt=""
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
