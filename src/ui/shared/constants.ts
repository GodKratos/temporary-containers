import {
  ContainerColor,
  ContainerIcon,
  ToolbarIconColors,
  RedirectorDomain
} from '../../types';

// Container colors from shared.ts
export const CONTAINER_COLORS: ContainerColor[] = [
  'blue',
  'turquoise', 
  'green',
  'yellow',
  'orange',
  'red', 
  'pink',
  'purple',
  'toolbar'
];

// Container icons from shared.ts
export const CONTAINER_ICONS: ContainerIcon[] = [
  'fingerprint',
  'briefcase',
  'dollar',
  'cart',
  'circle', 
  'gift',
  'vacation',
  'food',
  'fruit',
  'pet',
  'tree',
  'chill',
  'fence'
];

// Toolbar icon colors from shared.ts
export const TOOLBAR_ICON_COLORS: ToolbarIconColors[] = [
  'default',
  'black-simple',
  'blue-simple', 
  'red-simple',
  'white-simple'
];

// Redirector domains combined from shared.ts and shared.js
export const REDIRECTOR_DOMAINS_DEFAULT: RedirectorDomain[] = [
  't.co',
  'outgoing.prod.mozaws.net',
  'slack-redir.net',
  'away.vk.com',
  'accounts.google.com',
  'login.microsoftonline.com',
  'paypal.com',
  'login.live.com',
  'github.com',
  'gitlab.com',
  'login.yahoo.com',
  'amazon.com',
  'amazon.de',
  'amazon.co.uk',
  'ebay.com',
  'ebay.de',
  'ebay.co.uk',
  'facebook.com',
  'twitter.com'
];

// Ignored domains from shared.ts
export const IGNORED_DOMAINS_DEFAULT = ['getpocket.com', 'addons.mozilla.org'];

// Container removal times from shared.js
export const CONTAINER_REMOVAL_DEFAULT: Record<number, [string, string]> = {
  900000: ['optionsGeneralContainerRemoval15Minutes', '15 minutes after the last tab in it closes (default)'],
  300000: ['optionsGeneralContainerRemoval5Minutes', '5 minutes after the last tab in it closes'],
  120000: ['optionsGeneralContainerRemoval2Minutes', '2 minutes after the last tab in it closes'],
  0: ['optionsGeneralContainerRemovalInstant', 'After the last tab in it closes']
};
