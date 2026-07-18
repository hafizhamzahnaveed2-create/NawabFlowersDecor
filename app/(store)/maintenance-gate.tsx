import Image from "next/image";
import { SITE_LOGO, SITE_NAME } from "@/lib/brand";

export function MaintenanceGate({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <div className="max-w-md rounded-petal border border-stone bg-white p-10 shadow-bloom">
        <Image
          src={SITE_LOGO}
          alt={SITE_NAME}
          width={88}
          height={88}
          className="mx-auto rounded-full object-cover ring-1 ring-stone"
        />
        <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-sage">
          Temporarily closed
        </p>
        <h1 className="mt-3 font-display text-4xl text-burgundy">
          {SITE_NAME}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink/80">{message}</p>
      </div>
    </div>
  );
}
