import { Link, useLocation, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchPredictionDetail, sendPredictionResultByEmail } from '../services/predictionApi'

function isResultObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function emptyEmailStatus() {
  return {
    loading: false,
    success: false,
    error: '',
    message: '',
  }
}

function PredictionResult() {
  const location = useLocation()
  const { predictionId } = useParams()

  return (
    <PredictionResultContent
      key={`${location.key}:${predictionId || 'submission'}`}
      predictionId={predictionId}
      stateResponse={location.state?.predictionResponse || null}
      stateFileName={location.state?.submittedFileName || null}
    />
  )
}

function PredictionResultContent({
  predictionId,
  stateResponse,
  stateFileName,
}) {
  const canUseStateResponse = Boolean(stateResponse) && (
    !predictionId ||
    String(stateResponse?.summary?.prediction_id) === String(predictionId)
  )

  const [loadedPrediction, setLoadedPrediction] = useState(null)
  const [requestState, setRequestState] = useState({
    loading: Boolean(predictionId) && !canUseStateResponse,
    error: '',
  })
  const [emailStatus, setEmailStatus] = useState(emptyEmailStatus)

  useEffect(() => {
    let mounted = true

    async function loadFromApi() {
      if (!predictionId || canUseStateResponse) return

      try {
        const data = await fetchPredictionDetail(predictionId)
        if (!mounted) return

        setLoadedPrediction(data)
        setRequestState({
          loading: false,
          error: '',
        })
      } catch (error) {
        if (!mounted) return

        setRequestState({
          loading: false,
          error: error?.message || 'Failed to load prediction result.',
        })
      }
    }

    loadFromApi()

    return () => {
      mounted = false
    }
  }, [predictionId, canUseStateResponse])

  const predictionResponse = canUseStateResponse
    ? stateResponse
    : loadedPrediction

  const loading = requestState.loading
  const loadError = requestState.error

  const summary = predictionResponse?.summary || {}
  const result = isResultObject(predictionResponse?.result)
    ? predictionResponse.result
    : null

  const hasPrediction = Boolean(predictionResponse)
  const hasResult = result !== null
  const canDownload = !loading && !loadError && hasResult
  const canEmail = canDownload &&
    Number.isInteger(summary.prediction_id) &&
    summary.prediction_id > 0

  const submittedFileName = summary.file_name || (
    canUseStateResponse ? stateFileName : null
  )
  const submittedSequenceId = result?.sequence_id || null

  const rowsReceived = summary.rows_received
  const modelMode = summary.model_mode
  const columns = Array.isArray(summary.columns) ? summary.columns : []

  function handleDownloadResult() {
    if (!canDownload) return

    const date = new Date().toISOString().replace(/[:.]/g, '-')
    const idPart = summary.prediction_id ? `-${summary.prediction_id}` : ''
    const filename = `probio-predict-result${idPart}-${date}.json`

    const payload = {
      exported_at: new Date().toISOString(),
      source: 'ProBioPredict',
      summary,
      result,
      message: predictionResponse?.message || '',
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)

    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  async function handleSendResultByEmail() {
    if (!canEmail || emailStatus.loading) return

    setEmailStatus({
      loading: true,
      success: false,
      error: '',
      message: '',
    })

    try {
      const response = await sendPredictionResultByEmail({
        summary,
        result,
        submittedFileName,
        submittedSequenceId,
      })

      const deliveryMode = response?.delivery_mode
      const finalMessage = deliveryMode === 'console'
        ? 'Email generated in backend console mode. Open backend terminal to view the message output.'
        : response?.message || 'Prediction result email sent successfully.'

      setEmailStatus({
        loading: false,
        success: true,
        error: '',
        message: finalMessage,
      })
    } catch (error) {
      setEmailStatus({
        loading: false,
        success: false,
        error: error?.message || 'Failed to send the prediction result by email.',
        message: '',
      })
    }
  }

  function noResultMessage() {
    if (summary.status === 'failed') {
      return 'This prediction failed. No result is available.'
    }

    if (summary.status === 'pending') {
      return 'This prediction is pending. No result is available yet.'
    }

    return 'No result is available for this prediction.'
  }

  return (
    <section className="page-bg-history page-shell">
      <section className="panel">
        <h1>Prediction result</h1>

        {loading ? <p className="muted">Loading prediction result...</p> : null}
        {loadError ? (
          <p role="alert" style={{ color: '#ffb4b4' }}>{loadError}</p>
        ) : null}

        {!loading && !loadError && !hasPrediction ? (
          <article className="card card-soft section-space">
            <h3>No prediction result available</h3>
            <p className="muted">
              No prediction was selected. Please submit a CSV file or open a prediction from your history.
            </p>
            <div className="form-actions" style={{ marginTop: '0.8rem' }}>
              <Link to="/prediction" className="btn btn-accent">
                Go to prediction form
              </Link>
              <Link to="/history" className="btn btn-ghost">
                Open history
              </Link>
            </div>
          </article>
        ) : null}

        {!loading && !loadError && hasPrediction ? (
          <div className="form-layout section-space">
            <article className="card card-soft">
              <h3>Submission summary</h3>
              <ul className="simple-list">
                {submittedFileName ? (
                  <li>File: <strong>{submittedFileName}</strong></li>
                ) : null}
                {submittedSequenceId ? (
                  <li>Sequence ID: <strong>{submittedSequenceId}</strong></li>
                ) : null}
                {typeof rowsReceived === 'number' ? (
                  <li>Sequences received: <strong>{rowsReceived}</strong></li>
                ) : null}
                {summary.status ? (
                  <li>Status: <strong>{summary.status}</strong></li>
                ) : null}
                {modelMode ? (
                  <li>Model mode: <strong>{modelMode}</strong></li>
                ) : null}
                {columns.length > 0 ? (
                  <li>Columns: <strong>{columns.join(', ')}</strong></li>
                ) : null}
              </ul>

              <div
                className="form-actions"
                style={{ marginTop: '1rem', gap: '0.6rem', flexWrap: 'wrap' }}
              >
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={handleDownloadResult}
                  disabled={!canDownload}
                >
                  Download result
                </button>
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={handleSendResultByEmail}
                  disabled={!canEmail || emailStatus.loading}
                >
                  {emailStatus.loading ? 'Sending email...' : 'Send result by email'}
                </button>
              </div>

              {emailStatus.success ? (
                <p
                  className="muted"
                  style={{ marginTop: '0.35rem', color: '#b9f6ca' }}
                >
                  {emailStatus.message}
                </p>
              ) : null}
              {emailStatus.error ? (
                <p
                  style={{ color: '#ffb4b4', marginTop: '0.35rem' }}
                  role="alert"
                >
                  {emailStatus.error}
                </p>
              ) : null}
            </article>

            <article className="card card-feature">
              <h3>Prediction result</h3>

              {hasResult ? (
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
                        <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid rgba(255,255,255,0.16)' }}>
                          Sequence ID
                        </th>
                        <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid rgba(255,255,255,0.16)' }}>
                          Predicted class
                        </th>
                        <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid rgba(255,255,255,0.16)' }}>
                          Confidence
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '0.55rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          {result.sequence_id || '—'}
                        </td>
                        <td style={{ padding: '0.55rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          {result.predicted_class || '—'}
                        </td>
                        <td style={{ padding: '0.55rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          {typeof result.confidence === 'number' && Number.isFinite(result.confidence)
                            ? result.confidence.toFixed(2)
                            : '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted" role="status">
                  {noResultMessage()}
                </p>
              )}

              <div className="form-actions" style={{ marginTop: '0.9rem' }}>
                <Link to="/prediction" className="btn btn-accent">
                  Submit another file
                </Link>
                <Link to="/history" className="btn btn-ghost">
                  Open history
                </Link>
              </div>
            </article>
          </div>
        ) : null}
      </section>
    </section>
  )
}

export default PredictionResult