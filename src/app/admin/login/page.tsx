import { loginAction } from "./actions";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="shell stack">
      <h1>Admin Login</h1>
      <form action={loginAction} className="panel stack">
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" required />
        </label>
        {params.error ? <p className="lead">Invalid email or password.</p> : null}
        <button type="submit">Login</button>
      </form>
    </main>
  );
}
