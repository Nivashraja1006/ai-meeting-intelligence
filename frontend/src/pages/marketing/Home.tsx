import { Link } from "react-router-dom";
import MarketingLayout from "./MarketingLayout";

export default function Home() {
  return (
    <MarketingLayout>
      <header className="hero">
        <div className="wrap">
          <div>
            <div className="eyebrow">Meeting intelligence, automated</div>
            <h1>
              Every meeting says
              <br />
              more than <em>the notes</em> capture.
            </h1>
            <p className="lede">
              Paste a transcript or upload the recording. In about 10 seconds
              you get a structured summary, action items with owners, key
              decisions, and a follow-up email that's ready to send — no
              manual note-taking required.
            </p>
            <div className="hero-ctas">
              <Link to="/app" className="btn btn-primary">
                Open app →
              </Link>
              <Link to="/services" className="btn btn-ghost">
                See how it works
              </Link>
            </div>
            <div className="hero-proof">
              // used after standups, client calls, and planning sessions by
              teams who'd rather build than transcribe
            </div>
          </div>

          <div className="transcript-demo" aria-hidden="true">
            <div className="demo-head">
              <span>transcript_2026-07-05.txt</span>
              <div className="demo-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div className="demo-body">
              <div className="transcript-lines">
                <div className="line" style={{ animationDelay: ".1s" }}>
                  <span className="who">Sarah:</span> Login redesign is on
                  staging, QA can start today.
                </div>
                <div className="line" style={{ animationDelay: ".6s" }}>
                  <span className="who">Mike:</span> Stripe webhook issue —
                  need John's help by tomorrow.
                </div>
                <div className="line" style={{ animationDelay: "1.1s" }}>
                  <span className="who">John:</span> On it. Also, we're
                  pushing the mobile launch a month.
                </div>
                <div className="line" style={{ animationDelay: "1.6s" }}>
                  <span className="who">Sarah:</span> Agreed. Let's get the
                  client an update today.
                </div>
                <div className="line" style={{ animationDelay: "2.1s" }}>
                  <span className="who">Mike:</span> I'll draft that
                  follow-up now.
                </div>
              </div>
              <div className="sweep"></div>
              <div className="cards-out">
                <div className="mini-card">
                  <span className="tag">Action item · Mike</span>
                  <span className="body-txt small">
                    Resolve Stripe webhook issue with John's review
                  </span>
                </div>
                <div className="mini-card">
                  <span className="tag">Decision</span>
                  <span className="body-txt small">
                    Mobile launch postponed one month
                  </span>
                </div>
                <div className="mini-card">
                  <span className="tag">Follow-up email</span>
                  <span className="body-txt small">
                    Drafted and ready to send to client
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="wrap">
        <div className="stats-row">
          <div className="stat">
            <b>~10s</b>
            <span>Per transcript</span>
          </div>
          <div className="stat">
            <b>5</b>
            <span>Structured outputs</span>
          </div>
          <div className="stat">
            <b>0</b>
            <span>Manual note-taking</span>
          </div>
          <div className="stat">
            <b>1</b>
            <span>Ready-to-send email</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow" style={{ justifyContent: "center" }}>
              What comes out the other side
            </div>
            <h2>One transcript in. Five things your team actually needs.</h2>
            <p>
              No dashboards to configure. No prompts to write. Paste the raw
              conversation and read what happened.
            </p>
          </div>
          <div className="grid-3">
            <div className="feat-card">
              <div className="icon">Σ</div>
              <h3>Executive summary</h3>
              <p>
                A tight, readable account of what was discussed — written for
                someone who wasn't in the room.
              </p>
            </div>
            <div className="feat-card">
              <div className="icon">✓</div>
              <h3>Action items with owners</h3>
              <p>
                Every task extracted with who owns it and, when mentioned, a
                due date. Nothing falls through.
              </p>
            </div>
            <div className="feat-card">
              <div className="icon">◆</div>
              <h3>Key decisions</h3>
              <p>
                The calls that were actually made, separated from the
                discussion that led to them.
              </p>
            </div>
            <div className="feat-card">
              <div className="icon">?</div>
              <h3>Open questions</h3>
              <p>
                What's still unresolved, so the next meeting starts where
                this one left off.
              </p>
            </div>
            <div className="feat-card">
              <div className="icon">☺</div>
              <h3>Participant sentiment</h3>
              <p>
                A read on how each person came across — useful for spotting
                blockers before they escalate.
              </p>
            </div>
            <div className="feat-card">
              <div className="icon">✉</div>
              <h3>Follow-up email</h3>
              <p>A drafted, ready-to-send recap for anyone who couldn't attend.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="timeline-section section-alt">
        <div className="wrap">
          <div className="timeline-head">
            <div className="eyebrow">How it runs</div>
            <h2>From raw conversation to structured record</h2>
          </div>
          <div className="stamp-row">
            <div className="stamp">00:00</div>
            <div className="stamp-content">
              <h3>Paste or upload</h3>
              <p>
                Drop in a raw transcript, or upload the audio recording
                directly — no formatting required.
              </p>
            </div>
          </div>
          <div className="stamp-row">
            <div className="stamp">00:03</div>
            <div className="stamp-content">
              <h3>Structured extraction</h3>
              <p>
                The model reads the full conversation and pulls out summary,
                action items, decisions, sentiment, and a follow-up draft —
                validated against a fixed schema so nothing is missing.
              </p>
            </div>
          </div>
          <div className="stamp-row">
            <div className="stamp">00:10</div>
            <div className="stamp-content">
              <h3>Ready to use</h3>
              <p>
                Review it on screen, export as a PDF, or copy the follow-up
                email straight into your inbox.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap quote-block">
          <div className="eyebrow" style={{ justifyContent: "center" }}>
            From early teams
          </div>
          <blockquote style={{ marginTop: 20 }}>
            "We stopped assigning someone to take notes. The transcript does
            the work, and the follow-up email writes itself."
          </blockquote>
          <div className="quote-who">Engineering lead, mid-size product team</div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="cta-band">
            <h2>Turn your next meeting into a record, not a memory.</h2>
            <p>See it work on one of your own transcripts.</p>
            <div className="cta-actions">
              <Link to="/contact" className="btn btn-primary">
                Book a walkthrough
              </Link>
              <Link to="/services" className="btn btn-ghost">
                View plans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
