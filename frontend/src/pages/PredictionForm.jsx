import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const csvExample = `sequence_id,truncated_dna
LCASEI_A17,ATGCTTGACTTACCGATGAGTTCTAACGGTACCGTTAGCTAGCTACCGATAGC
LCASEI_A18,TTGACCGATGAGTTCTAACGGTACCGTTAGCTAGCTACCGATAGCATGCTTGA`

function PredictionForm() {
  const navigate = useNavigate()

  // Kept optional: can help identify or group the analysis request.
  const [sequenceId, setSequenceId] = useState('')
  const [csvFile, setCsvFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function isCsvFile(file) {
    if (!file) return false
    const lowerName = file.name.toLowerCase().trim()
    return lowerName.endsWith('.csv')
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null

    if (!file) {
      setCsvFile(null)
      return
    }

    if (!isCsvFile(file)) {
      setCsvFile(null)
      setError('Invalid format. Please upload a .csv file only.')
      return
    }

    setError('')
    setCsvFile(file)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (loading) return

    // Validation: file is required
    if (!csvFile) {
      setError('A CSV file containing truncated DNA is required.')
      return
    }

    // Validation: extension must be .csv
    if (!isCsvFile(csvFile)) {
      setError('Invalid format. Please upload a .csv file only.')
      return
    }

    setError('')
    setLoading(true)

    // Prepare future backend integration (multipart/form-data)
    const formData = new FormData()
    formData.append('dna_file', csvFile)
    if (sequenceId.trim()) {
      formData.append('sequence_id', sequenceId.trim())
    }

    // TODO (backend integration):
    // await fetch('/api/predictions/upload/', { method: 'POST', body: formData, headers: { Authorization: `Bearer ...` } })

    // Mock flow kept to avoid breaking current behavior
    setTimeout(() => {
      setLoading(false)
      navigate('/prediction-result')
    }, 900)
  }

  return (
    <section className="page-bg-prediction page-shell">
      <section className="panel">
        <h1>Prediction submission</h1>
        <p>
          Upload a <strong>.csv</strong> file containing truncated DNA sequences to run a prediction.
        </p>

        <div className="form-layout section-space">
          <article className="card card-soft">
            <h3>Expected CSV format</h3>
            <ul className="simple-list">
              <li>Upload a file with the <strong>.csv</strong> extension only.</li>
              <li>The file must contain truncated DNA sequence data.</li>
              <li>
                <strong>Sequence ID</strong> in the form is optional and can be used to label the
                analysis.
              </li>
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
              {csvExample}
            </pre>
          </article>

          <form className="card card-feature" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="sequence-id">Sequence ID (optional)</label>
              <input
                id="sequence-id"
                type="text"
                placeholder="e.g. Batch_2026_05_04"
                value={sequenceId}
                onChange={(e) => setSequenceId(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="dna-csv-file">Truncated DNA CSV file *</label>
              <input
                id="dna-csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
              />
              <p className="muted" style={{ marginTop: '0.45rem' }}>
                Accepted format: <strong>.csv</strong>
              </p>
            </div>

            {csvFile ? (
              <p className="muted" style={{ margin: '0.4rem 0 0' }}>
                Selected file: <strong>{csvFile.name}</strong>
              </p>
            ) : null}

            {error ? (
              <p style={{ color: '#ffb4b4', margin: '0.4rem 0 0' }} role="alert" aria-live="assertive">
                {error}
              </p>
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