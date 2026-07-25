import { Home, KeyRound } from "lucide-react";

import { login } from "@/app/login/actions";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-950 text-white shadow-sm">
            <Home className="size-6" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Apê 13-01
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Nosso novo lar
          </p>
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-950">
              <KeyRound className="size-5" />
            </div>

            <CardTitle>Acessar o portal</CardTitle>

            <CardDescription>
              Entre com o seu e-mail e senha para continuar.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form action={login} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>

                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>

                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-emerald-950 hover:bg-emerald-900"
              >
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          Acesso restrito aos responsáveis pelo Apê 13-01.
        </p>
      </div>
    </main>
  );
}