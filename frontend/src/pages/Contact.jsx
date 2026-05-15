import { useState } from 'react'

function Contact() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: '',
  })
  const [sent, setSent] = useState(false)

  function onChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function onSubmit(e) {
    e.preventDefault()
    setSent(true)
    setForm({ fullName: '', email: '', subject: '', message: '' })
  }

  return (
    <section className="page-shell">
      <section className="panel">
        <h1>Contact us</h1>
        <p>Need help or want to share feedback? Send us a message.</p>

        <form className="card card-soft section-space" onSubmit={onSubmit}>
          <label>
            Full name
            <input name="fullName" value={form.fullName} onChange={onChange} required />
          </label>
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={onChange} required />
          </label>
          <label>
            Subject
            <input name="subject" value={form.subject} onChange={onChange} required />
          </label>
          <label>
            Message
            <textarea name="message" value={form.message} onChange={onChange} rows="5" required />
          </label>

          <button className="btn btn-accent" type="submit">Send message</button>
        </form>

        {sent ? <p className="muted">Thanks! Your message was recorded locally (frontend-only for now).</p> : null}
      </section>
    </section>
  )
}

export default Contact