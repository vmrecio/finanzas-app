import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>Finanzas</h1>
      <p>Personal finance management.</p>
      <nav>
        <Link href="/login">Log in</Link>
        <Link href="/register">Create account</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/accounts">Accounts</Link>
        <Link href="/categories">Categories</Link>
        <Link href="/transactions">Transactions</Link>
        <Link href="/budgets">Budgets</Link>
      </nav>
    </main>
  );
}
