import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PENDING_CODE_KEY } from '../lib/format';

export default function JoinLink() {
  const { code } = useParams();
  const nav = useNavigate();
  useEffect(() => {
    if (code) localStorage.setItem(PENDING_CODE_KEY, code.toUpperCase());
    nav('/onboarding', { replace: true });
  }, [code, nav]);
  return null;
}
