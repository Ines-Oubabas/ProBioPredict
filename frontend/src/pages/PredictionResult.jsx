import { Link, useLocation } from 'react-router-dom'

function PredictionResult() {
  const location = useLocation()
  const state = location.state || {}

  const predictionResponse = state.predictionResponse || null
  const submittedFileName = state.submittedFileName || null
  const submittedSequenceId = state.submittedSequenceId || null

  const summary = predictionResponse?.summary || {}
  const results = Array.isArray(predictionResponse?.results) ? predictionResponse.results : []

  const rowsReceived = summary?.rows_received
  const modelMode = summary?.model_mode
  const columns = Array.isArray(summary?.columns) ? summary.columns : []

  const hasData = Boolean(predictionResponse) && results.length > 0

  return (
    <section className="page-bg-history page-shell">
      <section className="panel">
        <h1>Prediction result</h1>

        {!hasData ? (
          <article className="card card-soft section-space">
            <h3>No prediction result available</h3>
            <p className="muted">
              You arrived on this page without submission context. Please submit a CSV file first.
            </p>
            <div className="form-actions" style={{ marginTop: '0.8rem' }}>
              <Link to="/prediction" className="btn btn-accent">
                Go to prediction form
              </Link>
            </div>
          </article>
        ) : (
          <div className="form-layout section-space">
            <article className="card card-soft">
              <h3>Submission summary</h3>
              <ul className="simple-list">
                {submittedFileName ? (
                  <li>
                    File: <strong>{submittedFileName}</strong>
                  </li>
                ) : null}

                {submittedSequenceId ? (
                  <li>
                    Sequence ID label: <strong>{submittedSequenceId}</strong>
                  </li>
                ) : null}

                {typeof rowsReceived === 'number' ? (
                  <li>
                    Rows received: <strong>{rowsReceived}</strong>
                  </li>
                ) : null}

                {modelMode ? (
                  <li>
                    Model mode: <strong>{modelMode}</strong>
                  </li>
                ) : null}

                {columns.length > 0 ? (
                  <li>
                    Columns: <strong>{columns.join(', ')}</strong>
                  </li>
                ) : null}
              </ul>

              {predictionResponse?.message ? (
                <p className="muted" style={{ marginTop: '0.75rem' }}>
                  {predictionResponse.message}
                </p>
              ) : null}
            </article>

            <article className="card card-feature">
              <h3>Returned results</h3>

              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginTop: '0.6rem',
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '0.55rem',
                          borderBottom: '1px solid rgba(255,255,255,0.16)',
                        }}
                      >
                        Sequence ID
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '0.55rem',
                          borderBottom: '1px solid rgba(255,255,255,0.16)',
                        }}
                      >
                        Predicted class
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '0.55rem',
                          borderBottom: '1px solid rgba(255,255,255,0.16)',
                        }}
                      >
                        Confidence
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item, index) => (
                      <tr key={`${item.sequence_id || 'sequence'}-${index}`}>
                        <td
                          style={{
                            padding: '0.55rem',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          {item.sequence_id || '—'}
                        </td>
                        <td
                          style={{
                            padding: '0.55rem',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          {item.predicted_class || '—'}
                        </td>
                        <td
                          style={{
                            padding: '0.55rem',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          {typeof item.confidence === 'number' ? item.confidence.toFixed(2) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="form-actions" style={{ marginTop: '0.9rem' }}>
                <Link to="/prediction" className="btn btn-accent">
                  Submit another file
                </Link>
              </div>
            </article>
          </div>
        )}
      </section>
    </section>
  )
}

export default PredictionResult
