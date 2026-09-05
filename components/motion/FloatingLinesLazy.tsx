"use client";
// FloatingLines imports `three`, and `three`'s renderer touches the
// browser-only `Image` global at module-import time. app/page.tsx is
// statically prerendered, and Next still executes a client component's
// module code on the server to produce that prerendered HTML — even though
// its *effects* never run there — which crashed with "Image is not
// defined" before this wrapper existed. `next/dynamic(..., { ssr: false })`
// is the fix, but Next.js disallows `ssr: false` inside a Server Component
// (page.tsx has no "use client"), so it has to be issued from a small
// client component instead. This file exists for exactly that reason.
import dynamic from "next/dynamic";

const FloatingLines = dynamic(() => import("./FloatingLines"), { ssr: false });

export default FloatingLines;
