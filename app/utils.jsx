import { useMatches, useFetchers } from "@remix-run/react";

export function useAnalyticsFromLoaders(dataKey= 'analytics') {
  const matches = useMatches();
  const data= {};

  matches.forEach((event) => {
    const eventData = event?.data;
    if (eventData && eventData[dataKey]) {
      Object.assign(data, eventData[dataKey]);
    }
  });

  return data;
}

export function useAnalyticsFromActions(dataKey = 'analytics') {
  const fetchers = useFetchers();
  const data = {};

  for (const fetcher of fetchers) {
    const formData = fetcher.formData;
    const fetcherData = fetcher.data;

    // Make sure that you have a successful action and an analytics payload
    if (formData && fetcherData && fetcherData[dataKey]) {
      Object.assign(data, fetcherData[dataKey]);

      try {
        if (formData.get(dataKey)) {
          // If the form submission contains data for the same dataKey
          // and is JSON parseable, then combine it with the resulting object
          const dataInForm = JSON.parse(String(formData.get(dataKey)));
          Object.assign(data, dataInForm);
        }
      } catch {
        // do nothing
      }
    }
  }
  return Object.keys(data).length ? data : undefined;
}
