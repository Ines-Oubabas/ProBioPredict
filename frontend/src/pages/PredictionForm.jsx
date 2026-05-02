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
    <section className="page-bg-prediction page-shell">
      <section className="panel">
        <h1>Prediction submission</h1>
        <p>Submit genomic sequence data in a guided workflow.</p>

        <div className="form-layout section-space">
          <article className="card card-soft">
            <h3>Expected format</h3>
            <ul className="simple-list">
              <li>Sequence ID is required.</li>
              <li>Use FASTA or plain DNA sequence (A, T, G, C).</li>
              <li>File upload will be added in a future step.</li>
            </ul>

            <p className="muted">Example:</p>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '12px',
                padding: '0.7rem',
                overflowX: 'auto',
              }}
            >
              {sequenceExample}
            </pre>
          </article>

          <form className="card card-feature" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="sequence-id">Sequence ID *</label>
              <input
                id="sequence-id"
                type="text"
                placeholder="e.g. LCASEI_A17"
                value={sequenceId}
                onChange={(e) => setSequenceId(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="genomic-sequence">Genomic sequence *</label>
              <textarea
                id="genomic-sequence"
                rows="10"
                placeholder="ATGCATGC..."
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
              />
            </div>

            {error ? (
              <p style={{ color: '#ffb4b4', margin: '0.4rem 0 0' }}>{error}</p>
            ) : null}

            <div className="form-actions">
              <button className="btn btn-accent" type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Run prediction (mock)'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </section>
  )
}

export default PredictionForm