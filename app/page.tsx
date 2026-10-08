import Poll from "@/components/Poll";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12 2xl:max-w-7xl">
      <h1 className="text-center text-3xl font-extrabold tracking-tight sm:text-5xl 2xl:text-6xl">
        What&apos;s your favorite season?
      </h1>
      <Poll />
    </main>
  );
}
