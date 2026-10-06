import { useState } from 'react';
import { useWorkspace } from '../workspace/WorkspaceProvider';
import { localDay, number } from '../../lib/format';
export function ActivityChart() {
  const { data } = useWorkspace();
  const [days, setDays] = useState(7);
  const values = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const day = localDay(date);
    return {
      label: `${date.getMonth() + 1}.${date.getDate()}`,
      count: data.deliveries.filter(
        (d) => d.status === 'completed' && d.completedAt && localDay(d.completedAt) === day,
      ).length,
    };
  });
  const max = Math.max(4, ...values.map((v) => v.count));
  const points = values.map(
    (v, i) => `${44 + i * (588 / (days - 1))},${180 - (v.count / max) * 140}`,
  );
  const path = `M ${points.join(' L ')}`;
  return (
    <section className="panel activity-panel">
      <div className="panel-heading">
        <div>
          <h2>
            연결의 흐름 <span className="muted-label">자료 발송 추이</span>
          </h2>
          <p>콘텐츠에서 시작된 연결을 확인하세요.</p>
        </div>
        <select
          aria-label="발송 추이 기간"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>최근 7일</option>
          <option value={14}>최근 14일</option>
          <option value={30}>최근 30일</option>
        </select>
      </div>
      <div className="chart-total">
        {number(values.reduce((sum, v) => sum + v.count, 0))}
        <span>건의 자료가 전달됐어요</span>
        <div className="chart-legend">
          <i />
          자료 발송 완료
        </div>
      </div>
      <svg
        className="activity-chart"
        viewBox="0 0 664 220"
        role="img"
        aria-label={`최근 ${days}일 자료 발송: ${values.map((v) => `${v.label} ${v.count}건`).join(', ')}`}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#205bff" stopOpacity=".28" />
            <stop offset="100%" stopColor="#205bff" stopOpacity=".015" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line
              x1="44"
              x2="632"
              y1={40 + i * 35}
              y2={40 + i * 35}
              stroke="#e9edf5"
              strokeDasharray="3 5"
            />
            <text x="25" y={44 + i * 35} textAnchor="end">
              {Math.round(max * (1 - i / 4))}
            </text>
          </g>
        ))}
        <path d={`${path} L 632,180 L 44,180 Z`} fill="url(#chart-fill)" />
        <path
          d={path}
          fill="none"
          stroke="#205bff"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {values.map((v, i) => (
          <g key={v.label}>
            <circle
              cx={44 + (i * 588) / (days - 1)}
              cy={180 - (v.count / max) * 140}
              r={days > 14 ? 2 : 3.5}
              fill="white"
              stroke="#205bff"
              strokeWidth="2"
            >
              <title>
                {v.label}: {v.count}건
              </title>
            </circle>
            {(days === 7 || i % (days === 14 ? 2 : 5) === 0 || i === days - 1) && (
              <text x={44 + (i * 588) / (days - 1)} y="210" textAnchor="middle">
                {v.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </section>
  );
}
