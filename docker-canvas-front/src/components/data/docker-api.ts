import { useState, useEffect } from 'react';

export function useStreamDockerEvents(url: string) {
  const [eventData, setEventData] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const signal = controller.signal;

    async function startStream() {
      try {
        const response = await fetch(url, { 
          mode: 'cors', // Default value, but good to be explicit
          credentials: 'include', // Include cookies if needed
          signal: signal
        });
        
        if (!response.body) {
          throw new Error('Response body is null');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        
        while (isMounted) {
          const { done, value } = await reader.read();
          
          if (done) {
            setLoading(false);
            break;
          }
          
          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });
          
          // Update the eventData with the new chunk
          setEventData(prevData => [...prevData, JSON.parse(chunk)]);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }

    startStream();

    // Cleanup function
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [url]);

  return { eventData, loading, error };
}

export default useStreamDockerEvents;