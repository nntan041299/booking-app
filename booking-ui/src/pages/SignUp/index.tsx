import { useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import PasswordField from "@/components/AuthLayout/PasswordField";
import Button from "@/components/Button";
import Field from "@/components/Field";
import Input from "@/components/Input";
import Loading from "@/components/Loading";
import { getGoogleLoginUrl } from "@/service/auth";
import { useRegister } from "@/hook/useRegister";
import { getErrorMessage } from "@/rest";

interface SignupErrors {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignUp = () => {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [signupErrors, setSignupErrors] = useState<SignupErrors>({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { mutate: register, isPending, isError, error } = useRegister();

  function signupValidate(
    values: {
      fullName: string;
      username: string;
      email: string;
      password: string;
      confirmPassword: string;
    } = { fullName, username, email, password, confirmPassword },
  ): boolean {
    const next: SignupErrors = {
      fullName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    };
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!values.fullName.trim()) next.fullName = "Required";
    if (!values.username.trim()) next.username = "Required";
    if (!values.email.trim()) next.email = "Required";
    else if (!emailPattern.test(values.email.trim()))
      next.email = "Invalid email";
    if (!values.password) next.password = "Required";
    else if (values.password.length < 8)
      next.password = "At least 8 characters";
    if (!values.confirmPassword) next.confirmPassword = "Required";
    if (
      values.password &&
      values.confirmPassword &&
      values.password !== values.confirmPassword
    ) {
      next.confirmPassword = "Passwords do not match";
    }

    setSignupErrors(next);
    return Object.values(next).every((v) => !v);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!signupValidate()) return;
    register({ fullName, username, email, password });
  }

  const clearError = (key: keyof SignupErrors) => {
    if (signupErrors[key]) setSignupErrors((prev) => ({ ...prev, [key]: "" }));
  };

  function handleGoogleLogin() {
    window.location.href = getGoogleLoginUrl();
  }

  return (
    <>
      <Loading isLoading={isPending} />

      <AuthLayout
        title="Create your account"
        subtitle="Join to book treatments and keep track of your visits."
        tagline="A little time for yourself, one tap away."
        taglineText="Create an account to browse our services, choose a time that suits you and book in seconds."
        wide
        onGoogle={handleGoogleLogin}
        disabled={isPending}
        switchPrompt="Already have an account?"
        switchLabel="Sign in"
        switchTo="/"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            <Field
              label="Full name"
              htmlFor="fullName"
              error={signupErrors.fullName}
            >
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearError("fullName");
                }}
                disabled={isPending}
                placeholder="John Doe"
                autoComplete="name"
                aria-invalid={Boolean(signupErrors.fullName)}
                className={`h-12 ${signupErrors.fullName ? "border-spa-danger" : ""}`}
              />
            </Field>
            <Field
              label="Username"
              htmlFor="username"
              error={signupErrors.username}
            >
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearError("username");
                }}
                disabled={isPending}
                placeholder="johndoe"
                autoComplete="username"
                aria-invalid={Boolean(signupErrors.username)}
                className={`h-12 ${signupErrors.username ? "border-spa-danger" : ""}`}
              />
            </Field>
          </div>

          <Field label="Email" htmlFor="email" error={signupErrors.email}>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
              disabled={isPending}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(signupErrors.email)}
              className={`h-12 ${signupErrors.email ? "border-spa-danger" : ""}`}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
              disabled={isPending}
              placeholder="••••••••"
              autoComplete="new-password"
              hint="At least 8 characters."
              error={signupErrors.password}
            />
            <PasswordField
              id="confirmPassword"
              label="Confirm password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearError("confirmPassword");
              }}
              disabled={isPending}
              placeholder="••••••••"
              autoComplete="new-password"
              error={signupErrors.confirmPassword}
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full min-h-12 mt-1 text-base"
          >
            {isPending ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </AuthLayout>
    </>
  );
};

export default SignUp;
