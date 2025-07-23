export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </main>
  );
}
