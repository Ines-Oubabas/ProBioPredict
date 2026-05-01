import { useState } from 'react'
import { premiumPlans } from '../data/mockData'
import { IconUpload, IconSpark } from '../components/Icons'

function planTag(name) {
  if (name === 'Starter') return 'For students'
  if (name === 'Pro') return 'Recommended'
  return 'For labs'
}

function Premium() {
  const [isStudent, setIsStudent] = useState(false)
  const [studentFile, setStudentFile] = useState(null)

  const effectiveProPrice = isStudent && studentFile ? '0 € / mois' : '19 € / mois'

  return (
    <section className="page-shell">
      <section className="panel premium-panel">
        <header className="premium-head">
          <h1 className="section-title">Premium access</h1>
          <p className="section-subtitle">Choose the plan that matches your research workflow.</p>
        </header>

        <article className="card card-soft student-access-card section-space">
          <div className="student-grid">
            <div className="student-copy">
              <h3>Student access</h3>
              <p>
                Students can unlock the Pro plan for free after verification of a valid student card.
                Professors, researchers, and laboratories keep paid premium access.
              </p>
              <p className="muted">Verification is mocked for now (prototype mode).</p>
            </div>

            <div className="student-actions">
              <label className="student-toggle">
                <input
                  type="checkbox"
                  checked={isStudent}
                  onChange={(e) => setIsStudent(e.target.checked)}
                />
                <span>I am a student</span>
              </label>

              {isStudent ? (
                <label className="upload-box premium-upload">
                  <span className="upload-top">
                    <IconUpload />
                    <strong>Upload student card (PDF / image)</strong>
                  </span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setStudentFile(e.target.files?.[0] || null)}
                  />
                  <small>{studentFile ? `Selected: ${studentFile.name}` : 'No file selected'}</small>
                </label>
              ) : (
                <div className="upload-placeholder">
                  <IconSpark />
                  <span>Enable student mode to upload card</span>
                </div>
              )}
            </div>
          </div>
        </article>

        <div className="pricing-grid section-space">
          {premiumPlans.map((plan) => {
            const isPro = plan.name === 'Pro'
            const price = isPro ? effectiveProPrice : plan.price

            return (
              <article
                key={plan.name}
                className={`card plan-card ${isPro ? 'plan-pro' : ''} ${plan.highlighted ? 'plan-highlight' : ''}`}
              >
                {plan.highlighted ? <span className="plan-badge">Most popular</span> : null}
                <span className="plan-tag">{planTag(plan.name)}</span>

                <div className="plan-top">
                  <h3>{plan.name}</h3>
                  <p className="price">{price}</p>
                </div>

                <ul className="simple-list plan-list">
                  {plan.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <button className={`btn ${isPro ? 'btn-accent' : 'btn-ghost'} plan-btn`} type="button">
                  Choose plan
                </button>
              </article>
            )
          })}
        </div>

        <div className="premium-footnote section-space">
          <p className="muted">
            Payment integration is currently mocked. You can still explore the complete upgrade flow.
          </p>
        </div>
      </section>
    </section>
  )
}

export default Premium