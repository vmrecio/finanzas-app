import { RequireAuth } from '../../containers/RequireAuth';
import { TransactionsContainer } from '../../containers/TransactionsContainer';

export default function TransactionsPage() {
  return (
    <RequireAuth>
      <main>
        <h1>Transactions</h1>
        <TransactionsContainer />
      </main>
    </RequireAuth>
  );
}
