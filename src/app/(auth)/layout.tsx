import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <Link href="/" className="mb-8 text-2xl font-bold text-foreground">
        DrawMate
      </Link>
      {children}
    </div>
  );
}
