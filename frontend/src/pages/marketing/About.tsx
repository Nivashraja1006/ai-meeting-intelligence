import { Link } from "react-router-dom";
import MarketingLayout from "./MarketingLayout";

export default function About() {
  return (
    <MarketingLayout>
      <header className="about-hero">
        <div className="wrap">
          <div className="eyebrow">Why we built this</div>
          <h1>
            Meetings produce more information than anyone can hold onto in
            their head.
          </h1>
          <p>
            Someone always ends up assigned to "take notes" — half-listening
            to the conversation while trying to write it down. Decisions get
            paraphrased. Action items get missed. We built AI Meeting
            Intelligence so the transcript itself becomes the record,
            structured the moment the meeting ends.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="wrap">
          <div className="eyebrow">What we believe</div>
          <div className="value-row">
            <div className="value-card">
              <h3>Structure over memory</h3>
              <p>
                If it was said in the meeting, it should exist as a
                searchable record — not a half-remembered summary sent the
                next day.
              </p>
            </div>
            <div className="value-card">
              <h3>Owners, not just tasks</h3>
              <p>
                An action item without an owner is a suggestion. Every task
                we extract is tied to a person, and a due date when one was
                mentioned.
              </p>
            </div>
            <div className="value-card">
              <h3>No new habits required</h3>
              <p>
                You already have the transcript or the recording. We don't
                ask you to change how you run meetings — only what happens to
                them afterward.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="timeline-section section-alt">
        <div className="wrap">
          <div className="timeline-head">
            <div className="eyebrow">How we got here</div>
            <h2>A short history</h2>
          </div>
          <div className="stamp-row">
            <div className="stamp">Day 1</div>
            <div className="stamp-content">
              <h3>The backend</h3>
              <p>
                Started with a single question: what does a meeting
                transcript need to become, to actually be useful a week
                later? The answer became five fixed fields — summary, action
                items, decisions, open questions, sentiment.
              </p>
            </div>
          </div>
          <div className="stamp-row">
            <div className="stamp">Day 5</div>
            <div className="stamp-content">
              <h3>Audio, not just text</h3>
              <p>
                Typed transcripts aren't how most meetings start. We added
                audio upload so a recording works exactly like pasted text.
              </p>
            </div>
          </div>
          <div className="stamp-row">
            <div className="stamp">Day 10</div>
            <div className="stamp-content">
              <h3>Ready for teams</h3>
              <p>
                Accounts, history, and exportable records — so the output of
                one meeting is there when the next one starts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="cta-band">
            <h2>See what your last meeting was actually about.</h2>
            <p>Bring a transcript. We'll walk through the output together.</p>
            <div className="cta-actions">
              <Link to="/contact" className="btn btn-primary">
                Talk to us
              </Link>
              <Link to="/services" className="btn btn-ghost">
                View services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
