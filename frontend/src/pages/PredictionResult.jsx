import { Link } from 'react-router-dom'
import { IconSpark } from '../components/Icons'

function PredictionResult() {
  return (
    <section className="page-shell">
      <section className="panel">
        <h1>Prediction result</h1>
        <p>Mocked response preview while backend integration is pending.</p>

        <div className="result-layout section-space">
          <article className="card card-feature">
            <div className="result-badge">
              <IconSpark className="icon" />
              <span>High confidence output</span>
            </div>

            <h3>Sequence analyzed</h3>
            <p className="result-label">L. casei A17</p>

            <div className="result-metrics">
              <div>
                <small>Classification</small>
                <strong>Probiotic</strong>
              </div>
              <div>
                <small>Confidence</small>
                <strong className="confidence-xl">92%</strong>
              </div>
            </div>

            <p>
              Decision summary: strong alignment with probiotic-associated genomic markers in this prototype run.
            </p>
          </article>

          <article className="card card-soft">
            <h3>Next actions</h3>
            <ul className="simple-list">
              <li>Save to history</li>
              <li>Send by email</li>
              <li>Compare with previous sequences</li>
            </ul>

            <div className="form-actions">
              <Link className="btn btn-ghost" to="/history">
                Open history
              </Link>
              <Link className="btn btn-accent" to="/prediction">
                New prediction
              </Link>
            </div>
          </article>
        </div>
      </section>
    </section>
  )
}

export default PredictionResult