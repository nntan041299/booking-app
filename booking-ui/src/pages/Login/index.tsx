import { useState } from "react";

import AuthLayout from "@/components/AuthLayout";
import PasswordField from "@/components/AuthLayout/PasswordField";
import Button from "@/components/Button";
import Field from "@/components/Field";
import Input from "@/components/Input";
import Loading from "@/components/Loading";
import { useLogin } from "@/hook/useLogin";
import { getGoogleLoginUrl } from "@/service/auth";
import { getErrorMessage } from "@/rest";

interface LoginErrors {
  username: string;
  password: string;
}

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loginErrors, setLoginErrors] = useState<LoginErrors>({
    username: "",
    password: "",
  });

  const { mutate: login, isPending, isError, error } = useLogin();

  function loginValidate(
    values: { username: string; password: string } = { username, password },
  ): boolean {
    const next: LoginErrors = { username: "", password: "" };
    if (!values.username.trim()) next.username = "Please fill in the username";
    if (!values.password) next.password = "Please fill in the password";
    setLoginErrors(next);
    return !next.username && !next.password;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!loginValidate()) return;
    login({ username, password });
  }

  function handleGoogleLogin() {
    window.location.href = getGoogleLoginUrl();
  }

  return (
    <>
      <Loading isLoading={isPending} />

      <AuthLayout
        title="Welcome back"
        subtitle="Sign in to manage your bookings."
        tagline="Welcome back to your calm corner."
        taglineText="Sign in to book treatments, manage your appointments and pick up where you left off."
        onGoogle={handleGoogleLogin}
        disabled={isPending}
        switchPrompt="New here?"
        switchLabel="Create account"
        switchTo="/signup"
      >
        {isError && (
          <div
            role="alert"
            className="rounded-[10px] border border-spa-danger-line bg-[#fdf3f1] px-3.5 py-3 text-sm text-spa-danger"
          >
            {getErrorMessage(error)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
          <Field
            label="Email or username"
            htmlFor="username"
            error={loginErrors.username}
          >
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (loginErrors.username)
                  setLoginErrors((p) => ({ ...p, username: "" }));
              }}
              onBlur={() => loginValidate({ username, password })}
              disabled={isPending}
              placeholder="you@example.com"
              autoComplete="username"
              aria-invalid={Boolean(loginErrors.username)}
              className={`h-12 ${loginErrors.username ? "border-spa-danger" : ""}`}
            />
          </Field>

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (loginErrors.password)
                setLoginErrors((p) => ({ ...p, password: "" }));
            }}
            onBlur={() => loginValidate({ username, password })}
            disabled={isPending}
            placeholder="••••••••"
            autoComplete="current-password"
            error={loginErrors.password}
          />

          <Button
            type="submit"
            disabled={isPending}
            className="w-full min-h-12 mt-1 text-base"
          >
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </AuthLayout>
    </>
  );
};

export default LoginPage;
