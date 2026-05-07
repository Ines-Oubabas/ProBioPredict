import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitPredictionCsv } from '../services/predictionApi'

const csvExample = `sequence_id,truncated_dna
LCASEI_A17,ATGCTTGACTTACCGATGAGTTCTAACGGTACCGTTAGCTAGCTACCGATAGC
LCASEI_A18,TTGACCGATGAGTTCTAACGGTACCGTTAGCTAGCTACCGATAGCATGCTTGA`

function PredictionForm() {
  const navigate = useNavigate()

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

  async function handleSubmit(event) {
    event.preventDefault()
    if (loading) return

    if (!csvFile) {
      setError('A CSV file containing truncated DNA is required.')
      return
    }

    if (!isCsvFile(csvFile)) {
      setError('Invalid format. Please upload a .csv file only.')
      return
    }

    setError('')
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
      setError(err?.message || 'Prediction submission failed.')
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

            <ul className="simple-list">
              <li>
                The uploaded file must be in <strong>.csv</strong> format.
              </li>
              <li>
                The first line must be a header row.
              </li>
              <li>
                Required columns must be exactly: <strong>sequence_id,truncated_dna</strong>.
              </li>
              <li>
                <strong>sequence_id</strong> is used to identify each sequence.
              </li>
              <li>
                <strong>truncated_dna</strong> must contain only the letters <strong>A, C, G, T</strong>.
              </li>
              <li>
                No required field should be empty.
              </li>
              <li>
                The file must respect backend size and row limits.
              </li>
              <li>
                After uploading the file, click <strong>Run prediction</strong>.
              </li>
              <li>
                The result will then be shown on the <strong>PredictionResult</strong> page.
              </li>
              <li>
                <strong>Download result</strong> and <strong>Send result by email</strong> actions are available
                after results are displayed.
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
              <label htmlFor="dna-csv-file">Truncated DNA CSV file *</label>
              <input
                id="dna-csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                disabled={loading}
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
