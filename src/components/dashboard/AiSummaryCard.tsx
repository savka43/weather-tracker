type AiSummaryCardProps = {
    summary: string
}

export default function AiSummaryCard({ summary }: AiSummaryCardProps) {
    return (
        <section className="dashboard-card ai-summary-card" aria-labelledby="ai-summary-title">
            <h2 id="ai-summary-title">AI Summary</h2>
            <p>{summary}</p>
        </section>
    )
}
