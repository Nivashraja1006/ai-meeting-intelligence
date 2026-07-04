import { Link } from "react-router-dom";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLink: string;
  footerHref: string;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  footerText,
  footerLink,
  footerHref,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold">
            AI
          </div>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          {footerText}{" "}
          <Link to={footerHref} className="font-medium text-indigo-400 hover:text-indigo-300">
            {footerLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
