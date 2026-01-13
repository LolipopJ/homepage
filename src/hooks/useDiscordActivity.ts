import * as React from "react";
import type { RichPresenceActivity } from "rich-presence-react";

interface DiscordActivityResponse {
  data: RichPresenceActivity[];
  last_updated_at: number;
}

const REQUEST_TIMEOUT = 10000;
const POLLING_INTERVAL = 30000;

const useDiscordActivity = () => {
  const [activities, setActivities] = React.useState<RichPresenceActivity[]>(
    [],
  );
  const [loading, setLoading] = React.useState<boolean>(true);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const isInitial = { current: true } as { current: boolean };

    let mounted = true;
    let currentController: AbortController | null = null;
    let requestTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let pollingIntervalId: ReturnType<typeof setInterval> | null = null;

    const fetchDiscordActivities = async () => {
      if (!mounted) return;

      if (isInitial.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      currentController?.abort();
      currentController = new AbortController();
      requestTimeoutId = setTimeout(() => {
        currentController?.abort();
      }, REQUEST_TIMEOUT);

      try {
        const res = await fetch("https://api.towind.fun/discord/activity", {
          signal: currentController.signal,
        });
        if (!res.ok)
          throw new Error(
            `Fetch Discord activities failed: HTTP ${res.status}`,
          );
        let response: DiscordActivityResponse;
        try {
          response = await res.json();
        } catch (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          parseJsonError: any
        ) {
          throw new Error(
            `Failed to parse Discord activities response as JSON: ${parseJsonError?.message ?? String(parseJsonError)}`,
          );
        }
        if (!mounted) return;

        setActivities(() => {
          const _activities = response.data;
          return _activities.sort((a, b) => (a.type ?? 0) - (b.type ?? 0));
        });
        setError(null);
        isInitial.current = false;
      } catch (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        err: any
      ) {
        if (!mounted) return;
        if (err?.name === "AbortError") return;

        setError(
          err instanceof Error
            ? err
            : new Error(
                `An error occurred while requesting Discord activities: ${String(err)}`,
              ),
        );
      } finally {
        if (mounted) {
          clearTimeout(requestTimeoutId);
          requestTimeoutId = null;
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    const stopPolling = () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
      }
      if (requestTimeoutId) {
        clearTimeout(requestTimeoutId);
        requestTimeoutId = null;
      }
      currentController?.abort();
    };

    const startPolling = () => {
      stopPolling();
      fetchDiscordActivities();
      pollingIntervalId = setInterval(() => {
        if (!mounted) return;
        fetchDiscordActivities();
      }, POLLING_INTERVAL);
    };

    const handleVisibilityChange = () => {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "visible") {
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === "visible") startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return { activities, initialized: !loading, refreshing, error } as const;
};

export default useDiscordActivity;
