import { AccountsContainer } from '../../containers/AccountsContainer';
import { RequireAuth } from '../../containers/RequireAuth';

export default function AccountsPage() {
  return (
    <RequireAuth>
      <main>
        <h1>Accounts</h1>
        <AccountsContainer />
      </main>
    </RequireAuth>
  );
}
