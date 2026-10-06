import { Link, type LinkProps } from 'react-router-dom';
import { useWorkspace } from '../workspace/WorkspaceProvider';

export function CreateAutomationLink({ children, ...props }: Omit<LinkProps, 'to'>) {
  const { data } = useWorkspace();
  const connected = data.account?.status === 'connected';
  return (
    <Link {...props} to={connected ? '/automations/new' : '/settings/instagram'}>
      {connected ? children : '인스타그램 연결하기'}
    </Link>
  );
}
