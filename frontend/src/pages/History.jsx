import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { recentHistory } from '../data/mockData'

const FILTERS = ['All', 'Probiotic', 'Non-probiotic']

function History() {
  const [activeFilter, setActiveFilter] = useState('All')

  const rows = useMemo(() => {
    if (activeFilter === 'All') return recentHistory
    return recentHistory.filter((r) => r.result === activeFilter)
  }, [activeFilter])

  return (
    <section className="page-shell">
      <section className="panel">
        <h1>Prediction history</h1>
        <p>Review previous analyses in an organized product-style history.</p>

        <div className="filter-row">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`btn ${activeFilter === f ? 'btn-accent' : 'btn-ghost'}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <article className="card card-soft section-space">
          <div className="table-head">
            <span>Sequence</span>
            <span>Result</span>
            <span>Confidence</span>
            <span>Date</span>
            <span>Action</span>
          </div>

          <ul className="table-list">
            {rows.map((row) => (
              <li key={`${row.sequence}-${row.date}`}>
                <span>{row.sequence}</span>
                <span>
                  <span className={`badge-pill ${row.result === 'Probiotic' ? 'badge-probiotic' : 'badge-non'}`}>
                    {row.result}
                  </span>
                </span>
                <span>{row.confidence}</span>
                <span>{row.date}</span>
                <span>
                  <Link className="btn btn-ghost" to="/prediction-result">
                    View details
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </section>
  )
}

export default History