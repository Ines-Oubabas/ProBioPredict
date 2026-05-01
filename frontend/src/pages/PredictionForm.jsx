import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const sequenceExample = `>LCASEI_A17
ATGCTTGACTTACCGATGAGTTCTAACGGTACCGTTAGCTAGCTACCGATAGC`

function PredictionForm() {
  const navigate = useNavigate()
  const [sequenceId, setSequenceId] = useState('')
  const [sequence, setSequence] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()

    if (!sequenceId.trim() || !sequence.trim()) {
      setError('Sequence ID and genomic sequence are required.')
      return
    }

    setError('')
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      navigate('/prediction-result')
    }, 900)
  }

  return (
    <section className="auth-bg page-bg-prediction page-shell">
      <section className="panel form-workflow">
        <div className="form-intro">
          <h1>Prediction submission</h1>
          <p>Submit genomic sequence data in a guided workflow.</p>
        </div>

        <div className="form-layout">
          <article className="card card-soft">
            <h3>Expected format</h3>
            <ul className="simple-list">
              <li>Sequence ID is required.</li>
              <li>Use FASTA or plain DNA sequence (A, T, G, C).</li>
              <li>File upload will be added in a future step.</li>
            </ul>
            <p className="muted">Example:</p>
            <pre className="sequence-example">{sequenceExample}</pre>
          </article>

          <form className="card card-feature form-grid" onSubmit={handleSubmit}>
            <label>
              Sequence ID *
              <input
                type="text"
                placeholder="e.g. LCASEI_A17"
                value={sequenceId}
                onChange={(e) => setSequenceId(e.target.value)}
              />
            </label>

            <label>
              Genomic sequence *
              <textarea
                rows="10"
                placeholder="ATGCATGC..."
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
              />
            </label>

            {error ? <p className="error-text">{error}</p> : null}

            <button className="btn btn-accent" type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Run prediction (mock)'}
            </button>
          </form>
        </div>
      </section>
    </section>
  )
}

export default PredictionForm