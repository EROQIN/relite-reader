export default function LoginPage() {
  return (
    <section className="panel">
      <h1>Sign in</h1>
      <form className="form">
        <label>
          Email
          <input type="email" placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input type="password" />
        </label>
        <button type="submit">Sign in</button>
      </form>
      <p className="muted">Local-only reading is available without login.</p>
    </section>
  )
}
