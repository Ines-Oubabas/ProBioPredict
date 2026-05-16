import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { submitPredictionCsv } from '../services/predictionApi'

const csvExample = `sequence_id,truncated_dna
LCASEI_A17,ATGCTTGACTTACCGATGAGTTCTAACGGTACCGTTAGCTAGCTACCGATAGC
LCASEI_A18,TTGACCGATGAGTTCTAACGGTACCGTTAGCTAGCTACCGATAGCATGCTTGA`

function PredictionForm() {
  const navigate = useNavigate()

  const [csvFile, setCsvFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [planLimitReached, setPlanLimitReached] = useState(false)

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
      setPlanLimitReached(false)
      return
    }

    setError('')
    setPlanLimitReached(false)
    setCsvFile(file)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (loading) return

    if (!csvFile) {
      setError('A CSV file containing truncated DNA is required.')
      setPlanLimitReached(false)
      return
    }

    if (!isCsvFile(csvFile)) {
      setError('Invalid format. Please upload a .csv file only.')
      setPlanLimitReached(false)
      return
    }

    setError('')
    setPlanLimitReached(false)
    setLoading(true)

    try {
      const result = await submitPredictionCsv({
        csvFile,
      })

      navigate('/prediction-result', {
        state: {
          predictionResponse: result,
          submittedFileName: csvFile.name,
        },
      })
    } catch (err) {
      const message = err?.message || 'Prediction submission failed.'
      const isPlanLimit = message.toLowerCase().includes('free plan limit reached')

      setPlanLimitReached(isPlanLimit)
      setError(
        isPlanLimit
          ? 'You have reached your Free plan limit (3 predictions). Upgrade to Premium to continue uploading CSV files.'
          : message
      )
    } finally {
      setLoading(false)
    }
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
            <p className="muted" style={{ marginTop: '0.45rem' }}>
              Use a clean CSV with one sequence per line. This ensures secure validation and reliable parsing.
            </p>

            <ul className="simple-list">
              <li>
                File extension must be <strong>.csv</strong>.
              </li>
              <li>
                First line must be a header row.
              </li>
              <li>
                Required columns (exact order): <strong>sequence_id,truncated_dna</strong>.
              </li>
              <li>
                <strong>sequence_id</strong> identifies each sequence uniquely.
              </li>
              <li>
                <strong>truncated_dna</strong> accepts only <strong>A, C, G, T</strong>.
              </li>
              <li>Required fields cannot be empty.</li>
              <li>Backend limits for size and row count still apply.</li>
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
              <label htmlFor="dna-csv-file">Truncated DNA CSV file *</label>

              <label className="upload-box" htmlFor="dna-csv-file">
                <input
                  id="dna-csv-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                <span className="upload-cta">Click to choose a CSV file</span>
                <p className="muted" style={{ margin: '0.35rem 0 0' }}>
                  Accepted format: <strong>.csv</strong>
                </p>
                {csvFile ? (
                  <p className="upload-file-name">
                    Selected file: <strong>{csvFile.name}</strong>
                  </p>
                ) : (
                  <p className="muted" style={{ margin: '0.35rem 0 0' }}>
                    No file selected yet.
                  </p>
                )}
              </label>
            </div>

            {error ? (
              <div className={planLimitReached ? 'limit-alert' : ''} role="alert" aria-live="assertive">
                <p style={{ color: '#ffb4b4', margin: '0.4rem 0 0' }}>{error}</p>
                {planLimitReached ? (
                  <div className="form-actions" style={{ marginTop: '0.55rem' }}>
                    <Link to="/premium" className="btn btn-accent">
                      View Premium plan
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="form-actions">
              <button className="btn btn-accent" type="submit" disabled={loading}>
                {loading ? 'Uploading...' : 'Run prediction'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </section>
  )
}

export default PredictionForm