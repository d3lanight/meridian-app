// ━━━ Portfolio → Exposure Redirect ━━━
// v1.0.0 · S173 · Sprint 35
// /exposure/portfolio now redirects to /exposure.
// Full path cleanup (deletion + reference audit) tracked in S65-adjacent work.
import { redirect } from 'next/navigation'

export default function PortfolioPage() {
  redirect('/exposure')
}
