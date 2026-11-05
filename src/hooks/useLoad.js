import { useCallback, useEffect, useRef, useState } from 'react';

// Өгөгдөл ачаалах нийтлэг hook: loading, error, data төлөв болон дахин ачаалах функц.
export function useLoad(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const latest = useRef(0);

  const reload = useCallback(async () => {
    const ticket = ++latest.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loader();
      if (ticket === latest.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (ticket === latest.current) setState({ data: null, error, loading: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
