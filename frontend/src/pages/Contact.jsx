import { useState } from 'react'

const initialForm = {
  fullName: '',
  email: '',
  topic: '',
  subject: '',
  message: '',
}

function Contact() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState({
    sent: false,
    sentAt: '',
  })

  function onChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function onSubmit(event) {
    event.preventDefault()

    setStatus({
      sent: true,
      sentAt: new Date().toLocaleString(),
    })

    setForm(initialForm)
  }

  return (
    <section className="page-shell">
      <section className="panel contact-page">
        <h1>Contact ProBioPredict</h1>
        <p>
          We’re happy to help with technical support, product feedback, or collaboration ideas.
        </p>

        <div className="contact-layout section-space">
          <form className="card card-soft contact-form contact-hover" onSubmit={onSubmit}>
            <h3>Send a message</h3>
            <p className="muted">Frontend-only form for now (no backend storage yet).</p>

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
                <strong>Message saved locally.</strong>
                <p>
                  Thank you — your message was recorded on the frontend at {status.sentAt}. Backend
                  contact API will be connected in a future iteration.
                </p>
              </div>
            ) : null}
          </form>

          <aside className="contact-side">
            <article className="card card-feature contact-hover">
              <h3>Support</h3>
              <p className="muted">
                For account/login/prediction issues, include screenshots and the exact error message.
              </p>
            </article>

            <article className="card card-feature contact-hover">
              <h3>Feedback</h3>
              <p className="muted">
                Share UX suggestions, confusing labels, or flow improvements for the next sprint.
              </p>
            </article>

            <article className="card card-feature contact-hover">
              <h3>Collaboration</h3>
              <p className="muted">
                Interested in research partnerships or integration? Describe your use case and timeline.
              </p>
            </article>
          </aside>
        </div>
      </section>
    </section>
  )
}

export default Contact