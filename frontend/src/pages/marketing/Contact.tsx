import { useState, type FormEvent } from "react";
import MarketingLayout from "./MarketingLayout";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <MarketingLayout>
      <header className="about-hero">
        <div className="wrap">
          <div className="eyebrow">Contact</div>
          <h1>Bring a transcript. We'll show you the output.</h1>
          <p>
            Whether you want a walkthrough, have a question about plans, or
            want to talk about enterprise deployment — this reaches our team
            directly.
          </p>
        </div>
      </header>

      <section className="section" id="form">
        <div className="wrap contact-grid">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Your full name"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="email">Work email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="team-size">Team size</label>
              <select id="team-size" name="team-size">
                <option>1–10</option>
                <option>11–50</option>
                <option>51–200</option>
                <option>200+</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="message">What are you hoping to solve?</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                placeholder="Tell us about your meeting workflow today"
              ></textarea>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Send message
            </button>
            {submitted && (
              <p
                className="form-status"
                style={{
                  color: "var(--good)",
                  fontSize: 14,
                  marginTop: 14,
                  fontFamily: "var(--mono)",
                }}
              >
                ✓ Message received — we reply within one business day.
              </p>
            )}
          </form>

          <div>
            <div className="contact-info-card">
              <div className="eyebrow">Email</div>
              <p>
                <a href="mailto:hello@meetingintelligence.example">
                  hello@meetingintelligence.example
                </a>
              </p>
            </div>
            <div className="contact-info-card">
              <div className="eyebrow">Walkthrough</div>
              <p>
                Bring one real transcript to the call — most teams see the
                full output inside the first 10 minutes.
              </p>
            </div>
            <div className="contact-info-card">
              <div className="eyebrow">Enterprise &amp; security</div>
              <p>
                Ask about SSO, data retention controls, and on-prem / VPC
                deployment for larger teams.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
