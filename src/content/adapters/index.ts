import { SiteAdapter, ProductMetadata } from './types';
import { MyntraAdapter } from './myntra';
import { GenericAdapter } from './generic';

const ADAPTERS: SiteAdapter[] = [MyntraAdapter, GenericAdapter];

export function getActiveAdapter(): SiteAdapter {
  const hostname = window.location.hostname;
  return ADAPTERS.find((adapter) => adapter.matches(hostname)) || GenericAdapter;
}

export function extractProductFromElement(element: HTMLElement): ProductMetadata | null {
  const adapter = getActiveAdapter();
  return adapter.extractFromElement(element) || GenericAdapter.extractFromElement(element);
}
