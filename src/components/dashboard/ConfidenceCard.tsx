type ConfidenceCardProps = {
    confidence: number
}

export default function ConfidenceCard({ confidence }: ConfidenceCardProps) {
    return (
        <section className="dashboard-card confidence-card" aria-label="Model confidence">
            <span className="dashboard-card-label">Model confidence</span>
            <strong>{confidence}%</strong>
        </section>
    )
}
