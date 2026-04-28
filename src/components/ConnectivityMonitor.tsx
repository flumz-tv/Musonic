import {useEffect} from 'react';
import {start} from '../services/connectivityService';

export default function ConnectivityMonitor() {
  useEffect(() => {
    const stop = start();
    return stop;
  }, []);
  return null;
}
