import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { submitPredictionCsv } from '../services/predictionApi'

const csvExample = `sequence_id,truncated_dna
LCASEI_A17,ATGCTTGACTTACCGATGAGTTCTAACGGTACCGTTAGCTAGCTACCGATAGC
LCASEI_A18,TTGACCGATGAGTTCTAACGGTACCGTTAGCTAGCTACCGATAGCATGCTTGA`

function PredictionForm() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [csvFile, setCsvFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [planLimitReached, setPlanLimitReached] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  function isCsvFile(file) {
    if (!file) return false
    const lowerName = file.name.toLowerCase().trim()
    return lowerName.endsWith('.csv')
  }

  function applyFileSelection(file) {
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

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null
    applyFileSelection(file)
  }

  function handleDrop(event) {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
    if (loading) return
    const file = event.dataTransfer?.files?.[0] || null
    applyFileSelection(file)
  }

  function handleDragOver(event) {
    event.preventDefault()
    event.stopPropagation()
    if (!loading) setDragActive(true)
  }

  function handleDragLeave(event) {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
  }

  function handleUploadBoxClick() {
    if (loading) return
    fileInputRef.current?.click()
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
      const result = await submitPredictionCsv({ csvFile })
      const predictionId = result?.summary?.prediction_id
      navigate(predictionId ? `/prediction-result/${predictionId}` : '/prediction-result', {
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
        <p>Upload a <strong>.csv</strong> file containing truncated DNA sequences to run a prediction.</p>

        <div className="form-layout section-space">
          <article className="card card-soft">
            <h3>Expected CSV format</h3>
            <p className="muted" style={{ marginTop: '0.45rem' }}>
              Use a clean CSV with one sequence per line. This ensures secure validation and reliable parsing.
            </p>

            <ul className="simple-list">
              <li>File extension must be <strong>.csv</strong>.</li>
              <li>First line must be a header row.</li>
              <li>Required columns (exact order): <strong>sequence_id,truncated_dna</strong>.</li>
              <li><strong>sequence_id</strong> identifies each sequence uniquely.</li>
              <li><strong>truncated_dna</strong> accepts only <strong>A, C, G, T</strong>.</li>
              <li>Required fields cannot be empty.</li>
              <li>Backend limits for size and row count still apply.</li>
            </ul>

            <p className="muted">Example:</p>
            <pre style={{
              whiteSpace: 'pre-wrap',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '12px',
              padding: '0.7rem',
              overflowX: 'auto',
            }}>
              {csvExample}
            </pre>
          </article>

          <form className="card card-feature" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="dna-csv-file">Truncated DNA CSV file *</label>

              <input
                ref={fileInputRef}
                id="dna-csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                disabled={loading}
                style={{ display: 'none' }}
              />

              <div
                role="button"
                tabIndex={0}
                className={`upload-zone ${dragActive ? 'is-drag-active' : ''} ${loading ? 'is-disabled' : ''}`}
                onClick={handleUploadBoxClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleUploadBoxClick()
                  }
                }}
                aria-label="Click here to upload your CSV file"
              >
                <div className="upload-zone-badge">CSV</div>
                <p className="upload-zone-title">Click here to upload your CSV file</p>
                <p className="upload-zone-subtitle">or drag and drop your .csv file</p>
                <p className="upload-zone-state">
                  {csvFile ? <>Selected file: <strong>{csvFile.name}</strong></> : 'No file selected yet'}
                </p>
              </div>
            </div>

            {error ? (
              <div className={planLimitReached ? 'limit-alert' : ''} role="alert" aria-live="assertive">
                <p style={{ color: '#ffb4b4', margin: '0.4rem 0 0' }}>{error}</p>
                {planLimitReached ? (
                  <div className="form-actions" style={{ marginTop: '0.55rem' }}>
                    <Link to="/premium" className="btn btn-accent">View Premium plan</Link>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="form-actions upload-submit-row">
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