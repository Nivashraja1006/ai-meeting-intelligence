import { Link } from "react-router-dom";
import MarketingLayout from "./MarketingLayout";

export default function Services() {
  return (
    <MarketingLayout>
      <header className="about-hero">
        <div className="wrap">
          <div className="eyebrow">Services</div>
          <h1>Two ways in. One structured result.</h1>
          <p>
            Bring a transcript or a recording — the output is the same
            either way: a summary, action items, decisions, open questions,
            sentiment, and a follow-up email, ready in about 10 seconds.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="wrap">
          <div className="grid-2">
            <div className="feat-card" style={{ padding: 36 }}>
              <div className="icon">⌨</div>
              <h3 style={{ fontSize: 22 }}>Paste a transcript</h3>
              <p style={{ marginTop: 12 }}>
                Already have the conversation in text? Paste it directly — no
                formatting, speaker labels, or cleanup needed. The extraction
                handles raw, messy transcripts as they come.
              </p>
            </div>
            <div className="feat-card" style={{ padding: 36 }}>
              <div className="icon">▶</div>
              <h3 style={{ fontSize: 22 }}>Upload the recording</h3>
              <p style={{ marginTop: 12 }}>
                No transcript yet? Upload the audio file directly. It's
                transcribed and analyzed in the same pass — one upload, one
                structured result.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow" style={{ justifyContent: "center" }}>
              The five fields
            </div>
            <h2>Every meeting, broken into what matters</h2>
          </div>
          <div className="grid-3">
            <div className="feat-card">
              <div className="icon">Σ</div>
              <h3>Summary</h3>
              <p>
                A 2–4 paragraph account of what was actually discussed,
                written for someone catching up.
              </p>
            </div>
            <div className="feat-card">
              <div className="icon">✓</div>
              <h3>Action items</h3>
              <p>
                Task, owner, and due date when one was mentioned — never a
                vague to-do list.
              </p>
            </div>
            <div className="feat-card">
              <div className="icon">◆</div>
              <h3>Key decisions</h3>
              <p>
                The calls that were made, listed plainly and separated from
                the debate around them.
              </p>
            </div>
            <div className="feat-card">
              <div className="icon">?</div>
              <h3>Open questions</h3>
              <p>
                What's still unresolved — so the next meeting doesn't start
                from zero.
              </p>
            </div>
            <div className="feat-card">
              <div className="icon">☺</div>
              <h3>Sentiment</h3>
              <p>
                A read on each participant's tone, useful for catching
                friction before it grows.
              </p>
            </div>
            <div className="feat-card">
              <div className="icon">✉</div>
              <h3>Follow-up email</h3>
              <p>
                Subject and body, drafted and ready to send to anyone who
                missed the meeting.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow" style={{ justifyContent: "center" }}>
              Pricing
            </div>
            <h2>Straightforward plans, no per-seat surprises</h2>
            <p>Start free. Move up when your team's meeting volume grows.</p>
          </div>
          <div className="grid-3">
            <div className="pricing-card">
              <div className="eyebrow">Starter</div>
              <div className="price">Free</div>
              <ul className="plan-list">
                <li>10 analyses / month</li>
                <li>Transcript paste only</li>
                <li>PDF export</li>
                <li>7-day history</li>
              </ul>
              <Link
                to="/contact"
                className="btn btn-ghost center"
                style={{ justifyContent: "center" }}
              >
                Start free
              </Link>
            </div>
            <div className="pricing-card highlight">
              <div className="eyebrow">Team</div>
              <div className="price">
                $29<span> / month</span>
              </div>
              <ul className="plan-list">
                <li>Unlimited analyses</li>
                <li>Audio upload included</li>
                <li>Full meeting history</li>
                <li>Shared team workspace</li>
              </ul>
              <Link
                to="/contact"
                className="btn btn-primary center"
                style={{ justifyContent: "center" }}
              >
                Get started
              </Link>
            </div>
            <div className="pricing-card">
              <div className="eyebrow">Enterprise</div>
              <div className="price">Custom</div>
              <ul className="plan-list">
                <li>SSO &amp; access controls</li>
                <li>Dedicated support</li>
                <li>Custom retention policy</li>
                <li>On-prem / VPC option</li>
              </ul>
              <Link
                to="/contact"
                className="btn btn-ghost center"
                style={{ justifyContent: "center" }}
              >
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="cta-band">
            <h2>Try it on your next transcript.</h2>
            <p>No setup required — paste it in and see the structured output.</p>
            <div className="cta-actions">
              <Link to="/contact" className="btn btn-primary">
                Book a walkthrough
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
