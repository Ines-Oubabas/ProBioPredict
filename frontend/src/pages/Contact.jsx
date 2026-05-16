import { useState } from 'react'

const initialForm = {
  fullName: '',
  email: '',
  topic: '',
  subject: '',
  message: '',
}

function getTopicLabel(topicValue) {
  if (topicValue === 'support') return 'Support request'
  if (topicValue === 'feedback') return 'Product feedback'
  if (topicValue === 'collaboration') return 'Collaboration'
  return 'General topic'
}

function Contact() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState({
    sent: false,
    sentAt: '',
    sentTopicLabel: '',
  })

  function onChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function onSubmit(event) {
    event.preventDefault()

    const sentTopicLabel = getTopicLabel(form.topic)

    setStatus({
      sent: true,
      sentAt: new Date().toLocaleString(),
      sentTopicLabel,
    })

    setForm(initialForm)
  }

  return (
    <section className="page-shell">
      <section className="panel contact-page">
        <div className="contact-hero">
          <p className="hero-kicker">Contact · Prototype</p>
          <h1>Let’s improve your ProBioPredict workflow</h1>
          <p>
            Share support needs, UX feedback, or collaboration ideas. This contact flow is frontend-only for now,
            presented as a clean prototype before backend wiring.
          </p>

          <div className="hero-tags" style={{ marginTop: '0.4rem' }}>
            <span className="tag">Support within 24h target</span>
            <span className="tag">Product feedback loop</span>
            <span className="tag">Research collaboration</span>
          </div>
        </div>

        <div className="contact-layout section-space">
          <form className="card card-soft contact-form contact-hover" onSubmit={onSubmit}>
            <h3>Send a message</h3>
            <p className="muted">Prototype mode: messages are stored locally in the UI session.</p>

            <label>
              Full name
              <input
                name="fullName"
                value={form.fullName}
                onChange={onChange}
                placeholder="e.g. Amina Diallo"
                autoComplete="name"
                required
              />
            </label>

            <label>
              Professional email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="e.g. amina@lab-example.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Topic
              <select name="topic" value={form.topic} onChange={onChange} required>
                <option value="">Select a topic</option>
                <option value="support">Support request</option>
                <option value="feedback">Product feedback</option>
                <option value="collaboration">Collaboration</option>
              </select>
            </label>

            <label>
              Subject
              <input
                name="subject"
                value={form.subject}
                onChange={onChange}
                placeholder="Short summary of your request"
                required
              />
            </label>

            <label>
              Message
              <textarea
                name="message"
                value={form.message}
                onChange={onChange}
                rows="6"
                placeholder="Tell us what you need, context, and expected outcome…"
                required
              />
            </label>

            <div className="form-actions contact-actions">
              <button className="btn btn-accent" type="submit">Send message</button>
            </div>

            {status.sent ? (
              <div className="contact-success" role="status" aria-live="polite">
                <strong>Message captured successfully.</strong>
                <p>
                  Topic: <strong>{status.sentTopicLabel || 'General topic'}</strong> · Captured at {status.sentAt}.
                </p>
                <p>
                  This is a frontend prototype confirmation. Backend contact API integration is planned in a future sprint.
                </p>
              </div>
            ) : null}
          </form>

          <aside className="contact-side">
            <article className="card card-feature contact-hover">
              <h3>Support</h3>
              <p className="muted">
                For login, upload, or prediction issues, share exact steps and screenshots so we can reproduce quickly.
              </p>
            </article>

            <article className="card card-feature contact-hover">
              <h3>Feedback</h3>
              <p className="muted">
                Tell us what feels unclear: labels, navigation, result readability, or action placement.
              </p>
            </article>

            <article className="card card-feature contact-hover">
              <h3>Collaboration</h3>
              <p className="muted">
                Interested in research partnership or integration? Add your timeline and expected data flow.
              </p>
            </article>

            <article className="card card-feature contact-hover">
              <h3>Response workflow</h3>
              <p className="muted">
                1) Intake → 2) Triage by topic → 3) Product/technical follow-up with actionable next steps.
              </p>
            </article>
          </aside>
        </div>
      </section>
    </section>
  )
}

export default Contact