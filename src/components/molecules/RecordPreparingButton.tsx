const RecordPreparingButton = (): JSX.Element => {
    return (
        <button className="btn gap-2 bg-white border border-solid border-neutral-300 text-secondary" disabled>
            <div className="radial-progress animate-spin-slow" style={{ "--value": 85, "--size": "1.4rem", "--thickness": "2px" } as React.CSSProperties} />
            録音準備中
        </button>
    )
}

export { RecordPreparingButton }