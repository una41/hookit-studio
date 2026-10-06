import { useCallback, useEffect, useState } from 'react';
import { useBeforeUnload, useBlocker, useNavigate } from 'react-router-dom';
import type { Automation, AutomationStatus } from '../../types';
import { useWorkspace } from '../workspace/WorkspaceProvider';
import { useToast } from '../../components/ui/Toast';
import { errorMessage } from '../../lib/format';
import { isDemo } from '../../lib/firebase';
import { validateAutomation } from './model';
export function useAutomationForm(initial: Automation, isNew: boolean) {
  const [value, setValue] = useState(initial);
  const [baseline, setBaseline] = useState(JSON.stringify(initial));
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [destination, setDestination] = useState('');
  const dirty = JSON.stringify(value) !== baseline;
  const { save } = useWorkspace();
  const notify = useToast();
  const navigate = useNavigate();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );
  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (dirty) {
          event.preventDefault();
          event.returnValue = '';
        }
      },
      [dirty],
    ),
  );
  useEffect(() => {
    if (destination && !dirty) {
      navigate(destination, { replace: true });
      setDestination('');
    }
  }, [destination, dirty, navigate]);
  function update(patch: Partial<Automation>) {
    setValue((v) => ({ ...v, ...patch }));
    setErrors([]);
  }
  async function submit(status: AutomationStatus) {
    const next = { ...value, status };
    const issues = validateAutomation(next, status);
    if (issues.length) {
      setErrors(issues);
      document
        .getElementById('editor-errors')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setBusy(true);
    setErrors([]);
    try {
      await save(next);
      setValue(next);
      setBaseline(JSON.stringify(next));
      notify(
        status === 'active'
          ? isDemo
            ? '미리보기에 저장했어요. 실제 DM은 발송되지 않아요.'
            : '자동화 설정을 저장했어요.'
          : '자동화를 저장했어요.',
      );
      if (isNew) setDestination(`/automations/${next.id}/edit`);
    } catch (e) {
      setErrors([errorMessage(e)]);
    } finally {
      setBusy(false);
    }
  }
  return { value, update, dirty, busy, errors, submit, blocker };
}
