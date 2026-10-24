import { useRef, useState } from 'react'
import { submitContactMessage } from '../services/contactApi'

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
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const submittingRef = useRef(false)

  function onChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
    setConfirmation(null)
  }

  async function onSubmit(event) {
    event.preventDefault()

    // The ref blocks repeated submissions before React updates the button.
    if (submittingRef.current) return

    submittingRef.current = true
    setIsSending(true)
    setError('')
    setConfirmation(null)

    try {
      const data = await submitContactMessage(form)

      setConfirmation({
        id: data.id,
        createdAt: data.created_at,
        topicLabel: getTopicLabel(form.topic),
      })
      setForm(initialForm)
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to record your message. Please try again later.',
      )
    } finally {
      submittingRef.current = false
      setIsSending(false)
    }
  }

  return (
    <section className="page-shell">
      <section className="panel contact-page">
        <div className="contact-hero">
          <p className="hero-kicker">Contact</p>
          <h1>Let’s improve your ProBioPredict workflow</h1>
          <p>
            Share a support request, product feedback, or a collaboration idea.
            You can submit a message with or without an account.
          </p>

          <div className="hero-tags" style={{ marginTop: '0.4rem' }}>
            <span className="tag">Technical support</span>
            <span className="tag">Product feedback</span>
            <span className="tag">Research collaboration</span>
          </div>
        </div>

        <div className="contact-layout section-space">
          <form
            className="card card-soft contact-form contact-hover"
            onSubmit={onSubmit}
            aria-busy={isSending}
          >
            <h3>Send a message</h3>
            <p className="muted">
              All fields are required. Your message will be recorded for review
              by the ProBioPredict team.
            </p>

            <label>
              Full name
              <input
                name="fullName"
                value={form.fullName}
                onChange={onChange}
                placeholder="e.g. Amina Diallo"
                autoComplete="name"
                maxLength={150}
                disabled={isSending}
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
                maxLength={254}
                disabled={isSending}
                required
              />
            </label>

            <label>
              Topic
              <select
                name="topic"
                value={form.topic}
                onChange={onChange}
                disabled={isSending}
                required
              >
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
                maxLength={200}
                disabled={isSending}
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
                placeholder="Describe your request, its context, and the expected outcome…"
                maxLength={5000}
                aria-describedby="contact-message-count contact-message-guidance"
                disabled={isSending}
                required
              />
            </label>

            <p id="contact-message-count" className="muted">
              {form.message.length} / 5000 characters
            </p>
            <p id="contact-message-guidance" className="muted">
              Please do not include passwords, payment details, or sensitive
              research data.
            </p>

            <div className="form-actions contact-actions">
              <button
                className="btn btn-accent"
                type="submit"
                disabled={isSending}
              >
                {isSending ? 'Sending...' : 'Send message'}
              </button>
            </div>

            {error ? (
              <div
                className="card card-soft"
                role="alert"
                style={{ border: '1px solid #b45309' }}
              >
                <strong>Your submission needs attention.</strong>
                <p style={{ whiteSpace: 'pre-line' }}>{error}</p>
              </div>
            ) : null}

            {confirmation ? (
              <div
                className="contact-success"
                role="status"
                aria-live="polite"
              >
                <strong>Your message has been recorded successfully.</strong>
                <p>
                  Reference: <strong>#{confirmation.id}</strong>
                  {' · '}
                  Topic: <strong>{confirmation.topicLabel}</strong>
                </p>
                <p>
                  Recorded at{' '}
                  <time dateTime={confirmation.createdAt}>
                    {new Date(confirmation.createdAt).toLocaleString()}
                  </time>
                  .
                </p>
                <p>
                  Thank you for contacting ProBioPredict.
                  Your message is available to our team for review.
                </p>
              </div>
            ) : null}
          </form>

          <aside className="contact-side">
            <article className="card card-feature contact-hover">
              <h3>Support</h3>
              <p className="muted">
                For login, upload, or prediction issues, describe the steps
                you followed and any error message displayed.
              </p>
            </article>

            <article className="card card-feature contact-hover">
              <h3>Feedback</h3>
              <p className="muted">
                Tell us what feels unclear: labels, navigation, result
                readability, or action placement.
              </p>
            </article>

            <article className="card card-feature contact-hover">
              <h3>Collaboration</h3>
              <p className="muted">
                Interested in a research partnership or integration?
                Describe your goals, timeline, and expected data flow.
              </p>
            </article>

            <article className="card card-feature contact-hover">
              <h3>After submission</h3>
              <p className="muted">
                A confirmation and reference number appear once your message
                has been recorded. Response times may vary depending on
                the request.
              </p>
            </article>
          </aside>
        </div>
      </section>
    </section>
  )
}

export default Contact