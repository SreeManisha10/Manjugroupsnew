export default function LoadingSkeleton({ className = '' }) {
  return <span className={`loading-skeleton ${className}`.trim()} aria-hidden="true" />
}
