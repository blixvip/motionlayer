import { BrandMark } from "@/components/ui/BrandMark";

export default function LoginPage() {
  return (
    <main className="login-shell">
      <section className="login-plate">
        <div className="login-copy">
          <BrandMark />
          <h1>Finish the edit.<br />Keep every frame.</h1>
          <p>Motion graphics proposed from source evidence, approved by you, and rendered without touching the master.</p>
          <div className="registration-note"><span /> Source stays locked by default</div>
        </div>
        <form action="/api/auth/demo" method="post" className="login-form">
          <div>
            <span className="micro-label">DEMO WORKSPACE</span>
            <h2>Continue to MotionLayer</h2>
            <p>A secure local session is created for the seeded fixture project.</p>
          </div>
          <label>Email address<input name="email" type="email" defaultValue="creator@example.com" autoComplete="email" /></label>
          <button className="primary-button" type="submit">Enter workspace <span aria-hidden="true">→</span></button>
          <p className="form-note">Production auth is provider-adapted. No password is stored in demo mode.</p>
        </form>
      </section>
    </main>
  );
}
